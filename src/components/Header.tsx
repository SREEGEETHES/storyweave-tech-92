import { Button } from "@/components/ui/button";
import { Video, Menu, X, Home, ArrowLeft, ArrowRight, User as UserIcon, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavigationDropdown from "./NavigationDropdown";
import { useUser } from "@/contexts/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useUser();

  const featuresDropdown = [
    { label: "Idea to Video", href: "/features#idea-to-video", description: "Transform concepts into videos" },
    { label: "Character Creation", href: "/features#characters", description: "Create custom avatars" },
    { label: "Script Templates", href: "/features#scripts", description: "Professional templates" },
    { label: "Video Editor", href: "/editor", description: "Full-featured editing suite" }
  ];

  const aboutDropdown = [
    { label: "Our Story", href: "/about", description: "Learn about CinemaForge AI" },
    { label: "Team", href: "/about#team", description: "Meet our team" },
    { label: "Careers", href: "/about#careers", description: "Join our mission" },
    { label: "Contact", href: "/about#contact", description: "Get in touch" }
  ];

  const pricingDropdown = [
    { label: "Plans Overview", href: "/pricing", description: "Compare all plans" },
    { label: "Free Plan", href: "/pricing#free", description: "Get started for free" },
    { label: "Pro Plan", href: "/pricing#pro", description: "For professionals" },
    { label: "Enterprise", href: "/pricing#enterprise", description: "For teams" }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Navigation Controls */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-foreground/60 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(1)}
              className="text-foreground/60 hover:text-primary"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <Video className="h-8 w-8 text-primary animate-glow" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-rounded">
              AI Clips Universe
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className={`flex items-center space-x-1 transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-foreground/80 hover:text-primary'
                }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </a>
            <NavigationDropdown
              label="Features"
              items={featuresDropdown}
              currentPath={location.pathname}
            />
            <NavigationDropdown
              label="About Us"
              items={aboutDropdown}
              currentPath={location.pathname}
            />
            <NavigationDropdown
              label="Pricing"
              items={pricingDropdown}
              currentPath={location.pathname}
            />
          </nav>

          {/* CTA Buttons / User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard?tab=settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-primary"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  className="cta-primary"
                  onClick={() => navigate('/signup')}
                >
                  Start Free Trial
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/20 py-4">
            <nav className="flex flex-col space-y-4">
              <a href="/features" className="text-foreground/80 hover:text-primary transition-colors">
                Features
              </a>
              <a href="/about" className="text-foreground/80 hover:text-primary transition-colors">
                About Us
              </a>
              <a href="/pricing" className="text-foreground/80 hover:text-primary transition-colors">
                Pricing
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium">{user.user_metadata.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => navigate('/dashboard')}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive"
                      onClick={handleSignOut}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="cta-primary justify-start"
                      onClick={() => navigate('/signup')}
                    >
                      Start Free Trial
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;