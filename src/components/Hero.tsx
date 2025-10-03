import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your AI-Powered Fashion Stylist</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Try Before You{" "}
              <span className="gradient-text">Buy</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-md">
              Experience the future of online shopping with virtual try-on technology. Get personalized recommendations based on your skin tone and body shape.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/try-on">
                <Button variant="hero" size="lg" className="group">
                  Start Virtual Try-On
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg">
                  Browse Collection
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div>
                <p className="text-3xl font-bold gradient-text">1000+</p>
                <p className="text-sm text-muted-foreground">Fashion Items</p>
              </div>
              <div>
                <p className="text-3xl font-bold gradient-text">50K+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div>
                <p className="text-3xl font-bold gradient-text">AI</p>
                <p className="text-sm text-muted-foreground">Powered Styling</p>
              </div>
            </div>
          </div>

          <div className="relative animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <img
              src={heroBanner}
              alt="Fashion Collection"
              className="relative rounded-3xl shadow-[var(--shadow-strong)] w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
