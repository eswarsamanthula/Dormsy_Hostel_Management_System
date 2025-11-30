import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Users, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const RoleShowcase = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleRoleClick = (targetRole: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Navigate based on the target role
    switch (targetRole.toLowerCase()) {
      case 'admin':
        navigate('/admin');
        break;
      case 'warden':
        navigate('/warden');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/dashboard');
    }
  };
  const roles = [
    {
      title: "Administrator",
      icon: Shield,
      gradient: "bg-gradient-admin",
      color: "admin",
      description: "Manage hostel infrastructure, wardens, and analytics.",
      features: [
        "College & hostel setup",
        "Warden management", 
        "System analytics",
        "Global oversight"
      ],
      cta: "Admin Portal"
    },
    {
      title: "Warden", 
      icon: Users,
      gradient: "bg-gradient-warden",
      color: "warden",
      description: "Handle daily operations and student services.",
      features: [
        "Student management",
        "Attendance tracking",
        "Complaint handling",
        "Leave approvals"
      ],
      cta: "Warden Dashboard"
    },
    {
      title: "Student",
      icon: GraduationCap,
      gradient: "bg-gradient-student", 
      color: "student",
      description: "Access room info, pay fees, and manage visitors.",
      features: [
        "Room information",
        "Submit complaints", 
        "Fee payments",
        "QR code access"
      ],
      cta: "Student Portal"
    }
  ];

  return (
    <section id="roles" className="py-20 bg-gradient-to-b from-accent/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">User Roles</Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Three Roles, One Platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tailored dashboards for admins, wardens, and students
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {roles.map((role, index) => {
            const IconComponent = role.icon;
            return (
              <Card key={index} className="group relative overflow-hidden hover:shadow-strong transition-all duration-500 hover:-translate-y-2">
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${role.gradient} opacity-10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`} />
                
                <CardHeader className="relative z-10">
                  <div className={`w-16 h-16 ${role.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-medium`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl mb-2">{role.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {role.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    variant={role.color as any} 
                    className="w-full group-hover:shadow-medium transition-all"
                    onClick={() => handleRoleClick(role.title)}
                  >
                    {role.cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <Card className="inline-block p-8 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 border-primary/20">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Get Started Today</h3>
              <p className="text-muted-foreground">
                Choose your role and start managing smarter
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" onClick={() => navigate(user ? '/dashboard' : '/auth')}>
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RoleShowcase;