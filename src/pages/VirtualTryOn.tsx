import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Chatbot } from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { Camera, Share2, Upload, X, Instagram, Facebook, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import tryonFeature from "@/assets/tryon-feature.jpg";

export default function VirtualTryOn() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasFreeTrial, setHasFreeTrial] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [tryonResult, setTryonResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkFreeTrial();
    fetchProducts();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .limit(20);
    if (data) {
      setProducts(data);
    }
  };

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
            description: "Select a product to try it on",
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        toast({
          title: "Photo uploaded!",
          description: "Select a product to try it on",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const processTryOn = async () => {
    if (!capturedImage) {
      toast({
        title: "No image",
        description: "Please capture or upload a photo first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setTryonResult(null);

    try {
      const product = products.find(p => p.id === selectedProduct);
      
      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          userImage: capturedImage,
          productImage: product?.image_url || null,
          productName: product?.name || "stylish outfit"
        }
      });

      if (error) throw error;

      if (data.success && data.imageUrl) {
        setTryonResult(data.imageUrl);
        toast({
          title: "Try-on complete!",
          description: "See how the outfit looks on you",
        });
      } else {
        throw new Error("Failed to generate try-on");
      }
    } catch (error) {
      console.error("Try-on error:", error);
      toast({
        title: "Try-on failed",
        description: "Could not process virtual try-on. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
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

          {!showCamera && !capturedImage && !tryonResult && (
            <>
              <Card className="p-8 text-center space-y-6">
                <img 
                  src={tryonFeature} 
                  alt="Virtual Try-On" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button type="button" variant="hero" size="lg" onClick={startCamera} className="w-full sm:w-auto">
                      <Camera className="mr-2 h-5 w-5" />
                      Take Photo
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="lg" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hasFreeTrial ? "Sign in to continue using virtual try-on" : "First try-on is free!"}
                  </p>
                </div>
              </Card>

              {products.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Browse Our Collection</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.slice(0, 12).map((product) => (
                      <div 
                        key={product.id} 
                        className="group cursor-pointer space-y-2"
                        onClick={() => {
                          setSelectedProduct(product.id);
                          toast({
                            title: "Product Selected",
                            description: `${product.name} - Upload or take a photo to try it on!`
                          });
                        }}
                      >
                        <div className="aspect-[3/4] overflow-hidden rounded-lg border-2 border-transparent group-hover:border-primary transition-colors">
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                          <p className="text-sm text-primary">₹{product.price_inr}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
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

          {capturedImage && !tryonResult && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-4 space-y-4 h-fit">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Your Photo"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Your Photo</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setCapturedImage(null);
                      setSelectedProduct("");
                    }}
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take New Photo
                  </Button>
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Select an Outfit to Try</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any product to see how it looks on you
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`group cursor-pointer space-y-2 p-2 rounded-lg border-2 transition-all ${
                        selectedProduct === product.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:border-primary/50"
                      }`}
                    >
                      <div className="aspect-[3/4] overflow-hidden rounded-md">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium line-clamp-2">{product.name}</p>
                        <p className="text-xs text-primary font-semibold">₹{product.price_inr}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  type="button" 
                  variant="hero" 
                  onClick={processTryOn}
                  disabled={!selectedProduct || processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Virtual Try-On...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Try This Outfit
                    </>
                  )}
                </Button>
              </Card>
            </div>
          )}

          {tryonResult && (
            <Card className="p-4 space-y-4">
              <div className="relative">
                <img
                  src={tryonResult}
                  alt="Virtual Try-On Result"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button type="button" variant="hero" onClick={() => {
                  setTryonResult(null);
                  setCapturedImage(null);
                  setSelectedProduct("");
                }}>
                  <Camera className="mr-2 h-4 w-4" />
                  Try Another Look
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
