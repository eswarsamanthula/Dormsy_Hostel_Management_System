import { Button } from "@/components/ui/button";
import { ArrowRight, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/30 to-primary/10">
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/20">
                <Building className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">For colleges and universities</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Modern Hostel{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Management
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Automate attendance, manage fees, and improve student life—all in one platform.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button variant="hero" size="xl" className="group w-fit" onClick={handleGetStarted}>
                {user ? 'Go to Dashboard' : 'Start free trial'}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Free for 100 students • No credit card needed
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">100+</div>
                <div className="text-sm text-muted-foreground">Active colleges</div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Students managed</div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">99%</div>
                <div className="text-sm text-muted-foreground">Satisfaction rate</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong bg-card">
              <img 
                src={heroImage} 
                alt="Dormsy platform interface showcasing hostel management features"
                className="w-full h-auto"
                loading="eager"
                width="600"
                height="400"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;