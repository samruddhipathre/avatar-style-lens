import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    console.log('Starting comprehensive skin analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `You are a professional dermatologist and skin care expert. Analyze the facial skin in detail and provide a comprehensive analysis.` 
          },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: `Analyze this person's skin comprehensively and provide your response in valid JSON format with the following structure:
{
  "skinTone": "one of: Fair, Light, Medium, Olive, Tan, Brown, Dark",
  "skinType": "one of: Normal, Oily, Dry, Combination, Sensitive",
  "concerns": ["array of 3-5 specific skin concerns like acne, dark spots, fine lines, dryness, oiliness, uneven tone, etc."],
  "analysis": "2-3 sentences describing the overall skin condition",
  "recommendations": {
    "products": ["array of 3-4 specific product types recommended like cleanser, moisturizer, sunscreen, serum, etc."],
    "routine": ["array of 3-4 daily routine steps"],
    "ingredients": ["array of 3-4 beneficial ingredients to look for like hyaluronic acid, niacinamide, vitamin C, etc."]
  },
  "strengths": ["array of 2-3 positive aspects of the skin"]
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_skin",
              description: "Provide comprehensive skin analysis",
              parameters: {
                type: "object",
                properties: {
                  skinTone: {
                    type: "string",
                    enum: ["Fair", "Light", "Medium", "Olive", "Tan", "Brown", "Dark"]
                  },
                  skinType: {
                    type: "string",
                    enum: ["Normal", "Oily", "Dry", "Combination", "Sensitive"]
                  },
                  concerns: {
                    type: "array",
                    items: { type: "string" }
                  },
                  analysis: { type: "string" },
                  recommendations: {
                    type: "object",
                    properties: {
                      products: {
                        type: "array",
                        items: { type: "string" }
                      },
                      routine: {
                        type: "array",
                        items: { type: "string" }
                      },
                      ingredients: {
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["products", "routine", "ingredients"]
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["skinTone", "skinType", "concerns", "analysis", "recommendations", "strengths"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_skin" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to analyze skin');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No analysis data received');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log('Analysis result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Skin analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
