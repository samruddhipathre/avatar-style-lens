import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [orders, setOrders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-primary">₹{order.total_amount.toLocaleString('en-IN')}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
