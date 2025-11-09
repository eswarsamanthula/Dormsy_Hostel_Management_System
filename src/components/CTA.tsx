import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const benefits = [
    "Complete hostel management",
    "Role-based access", 
    "Real-time notifications",
    "Secure payments",
    "24/7 support"
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section id="cta" className="py-24 relative overflow-hidden bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-4xl mx-auto p-12 md:p-16 shadow-strong border-border/50">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-5xl font-bold leading-tight">
                Start Managing{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Smarter Today
                </span>
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join 100+ colleges using Dormsy for seamless hostel management.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left py-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="hero" size="xl" className="group" onClick={handleGetStarted}>
                {user ? 'Go to Dashboard' : 'Start free trial'}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl">
                Schedule demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Free for 100 students</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CTA;