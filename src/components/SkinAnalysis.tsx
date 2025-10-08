import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SkinAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Ensure video is playing and has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({
          title: "Camera Error",
          description: "Please wait for the camera to initialize",
          variant: "destructive"
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImagePreview(url);
            analyzeSkinTone(blob);
            stopCamera();
          } else {
            toast({
              title: "Capture Error",
              description: "Failed to capture photo. Please try again.",
              variant: "destructive"
            });
          }
        }, "image/jpeg");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      analyzeSkinTone(file);
    }
  };

  const analyzeSkinTone = async (imageBlob: Blob) => {
    setAnalyzing(true);
    setResult(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-skin-tone", {
          body: { image: base64Image }
        });

        if (error) throw error;

        setResult(data.skinTone);
        
        // Update user profile with skin tone
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ skin_tone: data.skinTone })
            .eq("id", user.id);
        }

        toast({
          title: "Analysis Complete!",
          description: `Your skin tone is: ${data.skinTone}`,
        });
      };
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze skin tone. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Skin Tone Analysis
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get personalized product recommendations based on your unique skin tone
        </p>
      </div>

      <Card className="max-w-2xl mx-auto p-8 space-y-6">
        {!showCamera && !imagePreview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              type="button"
              size="lg"
              variant="default"
              onClick={startCamera}
              className="h-32 flex flex-col gap-2"
            >
              <Camera className="h-8 w-8" />
              <span>Take Live Photo</span>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-32 flex flex-col gap-2"
            >
              <Upload className="h-8 w-8" />
              <span>Upload Photo</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {showCamera && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <div className="flex gap-4">
              <Button type="button" onClick={capturePhoto} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <Button type="button" onClick={stopCamera} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {imagePreview && (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-lg"
            />
            {analyzing && (
              <div className="text-center">
                <div className="animate-pulse text-muted-foreground">
                  Analyzing your skin tone...
                </div>
              </div>
            )}
            {result && (
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-lg font-semibold">Your Skin Tone: {result}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  We'll use this to recommend the perfect products for you!
                </p>
              </div>
            )}
            <Button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setResult(null);
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </Card>
    </section>
  );
};
