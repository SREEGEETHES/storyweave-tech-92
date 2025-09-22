import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import PricingPreview from "@/components/PricingPreview";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
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
  Github
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
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
                  <span className="text-sm font-medium">About CinemaForge AI</span>
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
                    Founded in 2024, CinemaForge AI emerged from a simple observation: creating 
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
                  <div className="text-4xl font-bold text-primary mb-2">2024</div>
                  <div className="text-muted-foreground mb-4">Founded</div>
                  <div className="text-2xl font-bold text-accent mb-2">50K+</div>
                  <div className="text-muted-foreground mb-4">Videos Created</div>
                  <div className="text-2xl font-bold text-feature-accent">120+</div>
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
        
        <PricingPreview />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
