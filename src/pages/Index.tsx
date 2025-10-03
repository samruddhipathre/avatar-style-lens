import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Chatbot } from "@/components/Chatbot";
import { ProductCard } from "@/components/ProductCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .limit(8);
    setProducts(data || []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Hero />
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Recommended For You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <Chatbot />
    </div>
  );
};

export default Index;
