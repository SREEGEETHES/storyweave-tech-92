import { Video, Twitter, Github, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "API Documentation", href: "#" },
      { name: "Changelog", href: "#" }
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" }
    ],
    resources: [
      { name: "Help Center", href: "#" },
      { name: "Video Tutorials", href: "#" },
      { name: "Community", href: "#" },
      { name: "Templates", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "GDPR", href: "#" }
    ]
  };

  return (
    <footer className="border-t border-border/20 bg-card/50">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <Video className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  VideoAI Pro
                </span>
              </div>
              
              <p className="text-muted-foreground mb-6 max-w-md">
                Transform your ideas into stunning videos with AI. The future of content creation 
                is here, and it's more accessible than ever.
              </p>
              
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
            
            {/* Links Sections */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-border/20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 VideoAI Pro. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Made with AI for creators worldwide</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;