import { Button } from "@/components/ui/button";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroVideo from "@/assets/hero-bg-video.mp4";

const Hero = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);
  
  // Mock authentication state - in a real app this would come from your auth provider
  const isLoggedIn = false; // Change this to test different states
  
  const handleStartFree = () => {
    if (!isLoggedIn) {
      navigate('/signup', { state: { planType: 'free' } });
    } else {
      navigate('/payment-portal', { state: { planType: 'free' } });
    }
  };

  const handleStartProTrial = () => {
    if (!isLoggedIn) {
      navigate('/signup', { state: { planType: 'pro' } });
    } else {
      navigate('/payment-portal', { state: { planType: 'pro' } });
    }
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/60" />
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

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8 animate-fade-in delay-300">
            <span className={`text-muted-foreground ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative glass rounded-full p-1 w-16 h-8"
            >
              <div className={`absolute top-1 w-6 h-6 bg-primary rounded-full transition-transform ${
                isYearly ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly <span className="text-feature-accent">(Save 20%)</span>
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in delay-400">
            <Button 
              className="cta-primary"
              onClick={handleStartFree}
            >
              Start Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              className="cta-secondary"
              onClick={handleStartProTrial}
            >
              Start Pro Trial
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