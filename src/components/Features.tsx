import { Link } from "react-router-dom";
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
      id: "idea-to-video",
      icon: Brain,
      title: "Idea to Video",
      description: "Transform your concepts into stunning videos with AI. Input your idea, select style, duration, and watch AI create magic.",
      highlight: "AI-Powered Creation"
    },
    {
      id: "characters",
      icon: Users,
      title: "Create Characters",
      description: "Upload images or use text prompts to generate custom avatars. Save and reuse characters across multiple projects.",
      highlight: "Custom Avatars"
    },
    {
      id: "scripts",
      icon: FileText,
      title: "Script Templates",
      description: "Industry-specific templates for every niche. From marketing to education, get professionally crafted scripts instantly.",
      highlight: "Ready-to-Use Scripts"
    },
    {
      id: "editor",
      icon: Edit3,
      title: "Video Editing Suite",
      description: "Drag-and-drop editor with trim, merge, overlays, captions, and mirror effects. Professional editing made simple.",
      highlight: "Intuitive Editing"
    },
    {
      id: "export",
      icon: Share2,
      title: "Social Media Export",
      description: "One-click export to YouTube, X (Twitter), LinkedIn, Facebook, Instagram (Reels, Stories, Posts), Pinterest, Discord, Slack, Telegram, Threads, and Reddit.",
      highlight: "Multi-Platform Ready"
    },
    {
      id: "styles",
      icon: Palette,
      title: "Multiple Styles",
      description: "Choose from realistic, cinematic, animated, artistic, cartoon styles and more. Perfect for every creative vision.",
      highlight: "Diverse Styles"
    },
    {
      id: "fast",
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate professional videos in minutes, not hours. Our optimized AI pipeline ensures rapid processing.",
      highlight: "Speed & Quality"
    },
    {
      id: "availability",
      icon: Clock,
      title: "24/7 Processing",
      description: "Round-the-clock video generation with cloud-based processing. Create content anytime, anywhere.",
      highlight: "Always Available"
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6 border border-primary/20 animate-float">
            <Wand2 className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium text-foreground/80">Powerful Features</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gradient tracking-tight">
            Everything You Need to Create
            <span className="block mt-2">Professional Videos</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From initial concept to final export, our comprehensive suite of AI-powered tools
            handles every aspect of video creation with precision and creativity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(250px,auto)]">
          {features.map((feature, index) => (
            <div
              key={index}
              id={feature.id}
              className={`group animate-fade-in hover-lift cursor-pointer relative overflow-hidden rounded-[2rem] border border-white/5 p-8 glass hover:border-primary/30 transition-all duration-500
                ${index === 0 ? "md:col-span-2 lg:col-span-2 row-span-2" : ""}
                ${index === 1 ? "md:col-span-1 lg:col-span-2" : ""}
                ${index === 4 ? "md:col-span-2 lg:col-span-2" : ""}
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col h-full justify-between z-10 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500 group-hover:border-primary/50`}>
                    <feature.icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors duration-500" />
                  </div>
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-full text-muted-foreground group-hover:text-primary transition-colors">
                    {feature.highlight}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-gradient transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="glass rounded-3xl p-10 max-w-3xl mx-auto border-primary/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <h3 className="text-3xl font-bold mb-4 text-foreground relative z-10">
              Ready to Transform Your Ideas?
            </h3>
            <p className="text-muted-foreground mb-8 text-lg relative z-10">
              Join thousands of creators who are already making stunning videos with AI
            </p>
            <Link to="/features" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gradient-premium rounded-full hover:shadow-lg hover:shadow-primary/25 hover:scale-105 relative z-10">
              Explore All Features
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;