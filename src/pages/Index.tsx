import Hero from "@/components/Hero";
import Features from "@/components/Features";
import PricingPreview from "@/components/PricingPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import {
  Video,
  Users,
  Globe,
  Award,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github,
  Send
} from "lucide-react";

const Index = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5678/webhook-test/c43b0c47-38b1-4a10-a10b-a8fa140246b9", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          message: message.trim(),
          timestamp: new Date().toISOString(),
          source: "CinemaForge AI Website"
        }),
      });

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully!",
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Main Content */}
      <main>
        <Hero />
        <Features />

        {/* About Us Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-8 animate-glow">
                  <Video className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium">About N4 Clips </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Revolutionizing Video Creation with AI
                </h2>

                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  We're on a mission to democratize cinematic video creation, making professional-quality
                  content accessible to creators, businesses, and storytellers worldwide.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div>
                  <h3 className="text-3xl font-bold mb-6 text-foreground">
                    Our Story
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Founded in 2025, N4 Clips emerged from a simple observation: creating
                    compelling video content was too complex, time-consuming, and expensive for
                    most creators and businesses.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our team of AI researchers, filmmakers, and engineers came together with a
                    vision to transform how stories are told through the power of artificial
                    intelligence and cinematic creativity.
                  </p>
                </div>
                <div className="glass rounded-2xl p-8 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">2025</div>
                  <div className="text-muted-foreground mb-4">Founded</div>
                  <div className="text-2xl font-bold text-accent mb-2">50K+</div>
                  <div className="text-muted-foreground mb-4">Videos Created</div>
                  <div className="text-2xl font-bold text-feature-accent">5+</div>
                  <div className="text-muted-foreground">Countries Served</div>
                </div>
              </div>

              {/* Values */}
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="feature-card text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4">Accessibility</h3>
                  <p className="text-muted-foreground">
                    Making professional video creation accessible to everyone,
                    regardless of technical expertise or budget.
                  </p>
                </div>

                <div className="feature-card text-center">
                  <Award className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4">Innovation</h3>
                  <p className="text-muted-foreground">
                    Pushing the boundaries of AI technology to deliver
                    cutting-edge video generation capabilities.
                  </p>
                </div>

                <div className="feature-card text-center">
                  <Globe className="w-12 h-12 text-feature-accent mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4">Community</h3>
                  <p className="text-muted-foreground">
                    Building a global community of creators and fostering
                    collaboration in the digital storytelling space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Message Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-8 animate-glow">
                  <Mail className="w-4 h-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Send us a Message</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Get in Touch
                </h2>

                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  Have a question, feedback, or just want to say hello? Send us a message and we'll get back to you.
                </p>
              </div>

              <form onSubmit={handleSendMessage} className="glass rounded-2xl p-8 space-y-6">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>

        <PricingPreview />
      </main>

    </div>
  );
};

export default Index;
