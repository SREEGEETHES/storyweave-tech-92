import { Button } from "@/components/ui/button";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-accent rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-feature-accent rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-primary rounded-full animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-8 animate-glow">
            <Sparkles className="w-4 h-4 text-feature-accent mr-2" />
            <span className="text-sm font-medium text-foreground font-rounded">
              AI-Powered Social Content Creation
            </span>
          </div>

          {/* Main heading */}
          <h1 className="hero-title mb-6 animate-fade-in font-rounded">
            Your Universe of
            <span className="block">AI-Generated Clips</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle mb-12 animate-fade-in delay-200 font-rounded">
            Create viral-ready content for Shorts, Reels, and TikToks. Transform any idea into 
            engaging AI videos that captivate your audience and boost your social media presence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in delay-400">
            <Button 
              className="cta-primary"
              onClick={() => navigate('/signup')}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="cta-secondary"
              onClick={() => navigate('/features')}
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in delay-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Videos Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">10M+</div>
              <div className="text-sm text-muted-foreground">Views Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-feature-accent mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="glass rounded-2xl p-4 border-primary/20">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-foreground">AI Processing Live</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;