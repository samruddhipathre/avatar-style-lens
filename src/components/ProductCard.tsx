import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AddToCartDialog } from "./AddToCartDialog";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price_inr: number;
    image_url: string | null;
    category: string;
    sizes?: string[];
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    setDialogOpen(true);
  };

  const handleConfirmAddToCart = async (size: string) => {
    setLoading(true);

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
    
    setLoading(false);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-[var(--shadow-medium)] transition-all duration-300">
      <Link to={`/products/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.preventDefault();
              toast({ title: "Coming soon", description: "Wishlist feature" });
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-xl font-bold text-primary">₹{product.price_inr.toLocaleString('en-IN')}</p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button type="button" variant="cart" className="flex-1" onClick={handleAddToCart} disabled={loading}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        <Link to="/try-on" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            Try On
          </Button>
        </Link>
      </CardFooter>

      <AddToCartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={product}
        onConfirm={handleConfirmAddToCart}
      />
    </Card>
  );
};
