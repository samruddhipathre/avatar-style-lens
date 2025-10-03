import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="p-8 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 gradient-text">About AVATAR</h1>
          <div className="space-y-4 text-muted-foreground">
            <p>AVATAR is your AI-powered virtual fashion stylist, revolutionizing online shopping with cutting-edge AR technology.</p>
            <p>Our platform combines virtual try-on capabilities with intelligent recommendations based on your skin tone and body shape.</p>
            <p>Experience fashion like never before - try before you buy, get personalized style advice, and shop with confidence.</p>
          </div>
        </Card>
      </main>
    </div>
  );
}
