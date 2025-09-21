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
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-8 animate-glow">
                <Video className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium">About CinemaForge AI</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Revolutionizing Video Creation with AI
              </h1>
              
              <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                We're on a mission to democratize cinematic video creation, making professional-quality 
                content accessible to creators, businesses, and storytellers worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                    Our Story
                  </h2>
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
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Our Values
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            
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
        </section>

        {/* Contact Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                  Get in Touch
                </h2>
                <p className="text-xl text-muted-foreground">
                  Ready to transform your video creation process? Let's talk.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4">
                    <div className="glass rounded-lg p-3">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Email</div>
                      <div className="text-muted-foreground">hello@cinemaforge.ai</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="glass rounded-lg p-3">
                      <Phone className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold">Phone</div>
                      <div className="text-muted-foreground">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="glass rounded-lg p-3">
                      <MapPin className="w-6 h-6 text-feature-accent" />
                    </div>
                    <div>
                      <div className="font-semibold">Address</div>
                      <div className="text-muted-foreground">
                        123 Innovation Drive<br />
                        San Francisco, CA 94105<br />
                        United States
                      </div>
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  <div className="pt-8">
                    <div className="font-semibold mb-4">Follow Us</div>
                    <div className="flex space-x-4">
                      <Button variant="ghost" size="sm" className="glass">
                        <Twitter className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="glass">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="glass">
                        <Github className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="glass rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Start Creating Today</h3>
                  <p className="text-muted-foreground mb-6">
                    Experience the future of video creation with our free trial. 
                    No credit card required.
                  </p>
                  <Button className="cta-primary w-full mb-4">
                    Start Free Trial
                  </Button>
                  <Button variant="ghost" className="w-full">
                    Schedule Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;