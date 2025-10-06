import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    sizes?: string[];
  };
  onConfirm: (size: string) => void;
}

export const AddToCartDialog = ({ open, onOpenChange, product, onConfirm }: AddToCartDialogProps) => {
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizes = product.sizes || ["S", "M", "L", "XL"];

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      toast({
        title: "Camera access granted",
        description: "You can now capture a photo for analysis",
      });
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use this feature",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvasRef.current.toDataURL("image/jpeg");
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeSizeAndSkinTone = async () => {
    if (!capturedImage) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-skin-tone", {
        body: { image: capturedImage },
      });

      if (error) throw error;

      if (data?.skinTone) {
        // Update user profile with skin tone
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from("profiles").upsert({
            id: session.user.id,
            skin_tone: data.skinTone,
          });
        }

        toast({
          title: "Analysis complete",
          description: `Detected skin tone: ${data.skinTone}. We'll recommend the best size for you!`,
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Could not analyze the photo. Please select a size manually.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedSize) {
      toast({
        title: "Size required",
        description: "Please select a size before adding to cart",
        variant: "destructive",
      });
      return;
    }
    stopCamera();
    onConfirm(selectedSize);
    onOpenChange(false);
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setSelectedSize("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Size</DialogTitle>
          <DialogDescription>
            Choose your size for {product.name}. You can also capture a photo to help us recommend the best fit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Size Selection */}
          <div className="space-y-3">
            <Label>Select Size</Label>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map((size) => (
                  <div key={size}>
                    <RadioGroupItem
                      value={size}
                      id={size}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={size}
                      className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Photo Capture Section */}
          <div className="space-y-3">
            <Label>Photo Analysis (Optional)</Label>
            <div className="flex gap-2">
              {!stream && !capturedImage && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestCameraPermission}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {stream && (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border"
                />
                <Button onClick={capturePhoto} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-2">
                <img src={capturedImage} alt="Captured" className="w-full rounded-lg border" />
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeSizeAndSkinTone}
                    disabled={analyzing}
                    className="flex-1"
                  >
                    {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analyze Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCapturedImage(null)}
                    className="flex-1"
                  >
                    Retake
                  </Button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Confirm Button */}
          <Button onClick={handleConfirm} className="w-full" disabled={!selectedSize}>
            Confirm & Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
