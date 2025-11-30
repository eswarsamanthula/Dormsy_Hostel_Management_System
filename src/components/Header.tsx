import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Roles", href: "#roles" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#cta" }
  ];

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const handleSignOut = async () => {
    if (isLoading) return; // Prevent multiple calls
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Dormsy
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!user && navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{profile?.role}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {profile?.full_name || profile?.email}
                  </span>
                </div>
                {profile?.role === 'admin' && (
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isLoading}>
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4">
              {!user && navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 text-left w-full"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
                {user ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Signed in as <span className="font-medium">{profile?.full_name || profile?.email}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </Button>
                    {profile?.role === 'admin' && (
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/admin')}>
                        Admin
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="justify-start" onClick={handleSignOut} disabled={isLoading}>
                      {isLoading ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                    <Button variant="hero" size="sm" onClick={handleGetStarted}>
                      Get Started
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