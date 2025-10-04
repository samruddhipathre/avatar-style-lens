import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export const ExploreCollection = () => {
  const categories = [
    {
      title: "Clothing",
      description: "Discover the latest fashion trends",
      icon: TrendingUp,
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
    },
    {
      title: "Shoes",
      description: "Step into style with our collection",
      icon: Sparkles,
      image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800",
    },
    {
      title: "Bags",
      description: "Complete your look with accessories",
      icon: ShoppingBag,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Explore Our Collection</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover curated collections tailored to your unique style and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {categories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <Card
              key={idx}
              className="group overflow-hidden cursor-pointer hover:shadow-[var(--shadow-strong)] transition-all duration-300"
            >
              <Link to="/products" className="block">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <Icon className="h-6 w-6 mb-2" />
                    <h3 className="text-xl font-bold">{category.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Link to="/products">
          <Button size="lg" className="group">
            View All Products
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
