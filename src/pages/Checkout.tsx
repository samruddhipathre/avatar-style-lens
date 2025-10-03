import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("cart_items")
      .select(`*, products(*)`)
      .eq("user_id", session.user.id);

    setCartItems(data || []);
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.products?.price_inr || 0) * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!address || !phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        delivery_address: address,
        phone: phone,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_inr: item.products.price_inr,
      size: item.selected_size,
      color: item.selected_color,
    }));

    await supabase.from("order_items").insert(orderItems);

    // Clear cart
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", session.user.id);

    toast({
      title: "Order placed successfully!",
      description: `Order ID: ${order.id}`,
    });

    navigate("/profile");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Delivery Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your complete address"
                    rows={4}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    Cash on Delivery
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex-1 cursor-pointer">
                    UPI Payment
                  </Label>
                </div>
              </RadioGroup>
            </Card>
          </div>

          <Card className="p-6 h-fit space-y-4">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.products?.name} x {item.quantity}</span>
                  <span>₹{(item.products?.price_inr * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
