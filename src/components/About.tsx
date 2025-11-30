import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  Lightbulb, 
  Shield,
  Award,
  Globe
} from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "To revolutionize hostel management through innovative digital solutions that enhance student life and operational efficiency."
    },
    {
      icon: Users,
      title: "Student-Centric",
      description: "Every feature is designed with the student experience at its core, ensuring comfort, convenience, and community."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Continuously evolving with cutting-edge technology to solve real-world hostel management challenges."
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Advanced security protocols and role-based access ensure data protection and user privacy."
    }
  ];

  const stats = [
    { number: "500+", label: "Colleges Trust Us" },
    { number: "50K+", label: "Students Served" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Support Available" }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">About Dormsy</Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Why Dormsy?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built for modern hostel management
          </p>
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl lg:text-3xl font-bold">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                We simplify hostel operations with smart automation, helping institutions save time and improve student experience.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                From attendance tracking to fee management, Dormsy handles it all—so you can focus on what matters most: student welfare.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/10">
                  <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label.replace(' Trust Us', '').replace(' Served', '').replace(' Guarantee', '').replace(' Available', '')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-8 bg-gradient-to-br from-card via-card to-accent/5">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-semibold">ISO 27001 Certified</h4>
                <p className="text-muted-foreground">
                  Enterprise-grade security and data protection for institutions worldwide.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Values Section */}
        <div className="space-y-12">
          <div className="text-center">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">What We Believe</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg">Student First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every feature is designed to improve student life and experience.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg">Smart Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Technology should reduce workload, not add complexity.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg">Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your data is protected with enterprise-grade security.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-lg">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  We're here whenever you need help or guidance.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;