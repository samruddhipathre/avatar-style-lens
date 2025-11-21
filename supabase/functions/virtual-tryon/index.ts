import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { userImage, productImage, productName } = await req.json();

    if (!userImage) {
      throw new Error('User image is required');
    }

    console.log('Processing virtual try-on request');

    // Use Lovable AI to overlay the product on the user image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: productImage 
                  ? `Create a realistic virtual try-on by naturally overlaying this ${productName || 'clothing item'} onto the person in the first image. The clothing should fit naturally on their body, matching their pose and proportions. Make it look realistic and professionally edited.`
                  : `Analyze this person's photo for virtual fashion try-on. Generate a realistic visualization showing how ${productName || 'stylish clothing'} would look on them, considering their body type, pose, and style.`
              },
              {
                type: "image_url",
                image_url: {
                  url: userImage
                }
              },
              ...(productImage ? [{
                type: "image_url" as const,
                image_url: {
                  url: productImage
                }
              }] : [])
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    const data = await response.json();
    console.log('AI response received');

    if (!response.ok) {
      console.error('AI API error:', data);
      throw new Error(data.error?.message || 'Failed to process virtual try-on');
    }

    const tryonImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!tryonImageUrl) {
      throw new Error('No image generated from AI');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: tryonImageUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Virtual try-on error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process virtual try-on';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});