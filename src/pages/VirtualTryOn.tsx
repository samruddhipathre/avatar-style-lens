import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Chatbot } from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { Camera, Share2, Upload, X, Instagram, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import tryonFeature from "@/assets/tryon-feature.jpg";

export default function VirtualTryOn() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasFreeTrial, setHasFreeTrial] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkFreeTrial();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkFreeTrial = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("profiles")
        .select("has_completed_free_trial")
        .eq("id", session.user.id)
        .single();
      
      setHasFreeTrial(data?.has_completed_free_trial || false);
    }
  };

  const startCamera = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      if (hasFreeTrial) {
        toast({
          title: "Sign in required",
          description: "Your free trial is complete. Please sign in to continue.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      if (session && !hasFreeTrial) {
        await supabase
          .from("profiles")
          .update({ has_completed_free_trial: true })
          .eq("id", session.user.id);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
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

      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/png");
        
        if (imageData && imageData !== "data:,") {
          setCapturedImage(imageData);
          stopCamera();
          toast({
            title: "Photo captured!",
            description: "Now you can share your look",
          });
        } else {
          toast({
            title: "Capture Error",
            description: "Failed to capture photo. Please try again.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const shareToSocial = (platform: string) => {
    const text = "Check out my virtual try-on from AVATAR!";
    const url = window.location.href;
    
    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "instagram":
        toast({
          title: "Instagram",
          description: "Save the image and share to Instagram",
        });
        return;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">Virtual Try-On</h1>
            <p className="text-muted-foreground">
              See how clothes look on you with our AR technology
            </p>
          </div>

          {!showCamera && !capturedImage && (
            <Card className="p-8 text-center space-y-6">
              <img 
                src={tryonFeature} 
                alt="Virtual Try-On" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="space-y-4">
                <Button type="button" variant="hero" size="lg" onClick={startCamera} className="w-full sm:w-auto">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Virtual Try-On
                </Button>
                <p className="text-sm text-muted-foreground">
                  {hasFreeTrial ? "Sign in to continue using virtual try-on" : "First try-on is free!"}
                </p>
              </div>
            </Card>
          )}

          {showCamera && (
            <Card className="p-4 space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-center gap-4">
                <Button type="button" variant="hero" onClick={capturePhoto}>
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
                <Button type="button" variant="outline" onClick={stopCamera}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {capturedImage && (
            <Card className="p-4 space-y-4">
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button type="button" variant="hero" onClick={() => setCapturedImage(null)}>
                  <Camera className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button type="button" variant="outline" onClick={() => shareToSocial("whatsapp")}>
                  <Share2 className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button type="button" variant="outline" onClick={() => shareToSocial("instagram")}>
                  <Instagram className="mr-2 h-4 w-4" />
                  Instagram
                </Button>
                <Button type="button" variant="outline" onClick={() => shareToSocial("facebook")}>
                  <Facebook className="mr-2 h-4 w-4" />
                  Facebook
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Chatbot />
    </div>
  );
}
