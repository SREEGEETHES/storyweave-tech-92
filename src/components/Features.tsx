import { 
  Wand2, 
  Users, 
  FileText, 
  Edit3, 
  Share2, 
  Zap,
  Brain,
  Palette,
  Clock
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "Idea to Video",
      description: "Transform your concepts into stunning videos with AI. Input your idea, select style, duration, and watch AI create magic.",
      highlight: "AI-Powered Creation"
    },
    {
      icon: Users,
      title: "Create Characters",
      description: "Upload images or use text prompts to generate custom avatars. Save and reuse characters across multiple projects.",
      highlight: "Custom Avatars"
    },
    {
      icon: FileText,
      title: "Script Templates",
      description: "Industry-specific templates for every niche. From marketing to education, get professionally crafted scripts instantly.",
      highlight: "Ready-to-Use Scripts"
    },
    {
      icon: Edit3,
      title: "Video Editing Suite",
      description: "Drag-and-drop editor with trim, merge, overlays, captions, and mirror effects. Professional editing made simple.",
      highlight: "Intuitive Editing"
    },
    {
      icon: Share2,
      title: "Social Media Export",
      description: "One-click export to YouTube Shorts, Instagram Reels, Facebook, Twitter, or download as MP4 for any platform.",
      highlight: "Multi-Platform Ready"
    },
    {
      icon: Palette,
      title: "Multiple Styles",
      description: "Choose from realistic, cinematic, animated, artistic, cartoon styles and more. Perfect for every creative vision.",
      highlight: "Diverse Styles"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate professional videos in minutes, not hours. Our optimized AI pipeline ensures rapid processing.",
      highlight: "Speed & Quality"
    },
    {
      icon: Clock,
      title: "24/7 Processing",
      description: "Round-the-clock video generation with cloud-based processing. Create content anytime, anywhere.",
      highlight: "Always Available"
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
            <Wand2 className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Everything You Need to Create
            <span className="block">Professional Videos</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From initial concept to final export, our comprehensive suite of AI-powered tools 
            handles every aspect of video creation with precision and creativity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full mb-2">
                  {feature.highlight}
                </span>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Ready to Transform Your Ideas?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators who are already making stunning videos with AI
            </p>
            <button className="cta-primary">
              Explore All Features
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;