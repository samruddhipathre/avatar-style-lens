import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate("/products");
      return;
    }

    if (!data) {
      toast({
        title: "Product not found",
        description: "This product doesn't exist",
        variant: "destructive",
      });
      navigate("/products");
      return;
    }

    setProduct(data);
    if (data.sizes && data.sizes.length > 0) {
      setSelectedSize(data.sizes[0]);
    }
    setLoading(false);
  };

  const handleAddToCart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setDialogOpen(true);
  };

  const handleConfirmAddToCart = async (size: string) => {
    setAddingToCart(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("cart_items").insert({
      user_id: session.user.id,
      product_id: product.id,
      quantity: 1,
      selected_size: size,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Added to cart",
        description: `${product.name} (Size: ${size}) has been added to your cart`,
      });
    }
    
    setAddingToCart(false);
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) return null;

  const sizes = product.sizes || ["S", "M", "L", "XL"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full aspect-[3/4] object-cover"
              />
            </Card>
            {product.model_image_url && (
              <Card className="overflow-hidden">
                <img
                  src={product.model_image_url}
                  alt={`${product.name} on model`}
                  className="w-full aspect-[3/4] object-cover"
                />
              </Card>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                {product.category}
              </p>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-3xl font-bold text-primary">
                ₹{product.price_inr.toLocaleString('en-IN')}
              </p>
            </div>

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Size Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Select Size</h2>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                <div className="grid grid-cols-4 gap-3">
                  {sizes.map((size) => (
                    <div key={size}>
                      <RadioGroupItem
                        value={size}
                        id={`size-${size}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`size-${size}`}
                        className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer font-semibold"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Stock Info */}
            {product.stock_count !== undefined && (
              <div className="text-sm text-muted-foreground">
                {product.stock_count > 0 ? (
                  <span className="text-green-600 font-medium">In Stock ({product.stock_count} available)</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock_count === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  toast({ title: "Coming soon", description: "Wishlist feature" });
                }}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <Link to="/try-on" className="block">
              <Button type="button" variant="outline" size="lg" className="w-full">
                Try On Virtually
              </Button>
            </Link>

            {/* Additional Info */}
            {(product.recommended_for_skin_tones || product.recommended_for_body_shapes) && (
              <Card className="p-4 space-y-2">
                <h3 className="font-semibold">Recommendations</h3>
                {product.recommended_for_skin_tones && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Skin Tones:</span> {product.recommended_for_skin_tones.join(", ")}
                  </p>
                )}
                {product.recommended_for_body_shapes && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Body Shapes:</span> {product.recommended_for_body_shapes.join(", ")}
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </main>

      <AddToCartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={product}
        onConfirm={handleConfirmAddToCart}
      />
    </div>
  );
}
