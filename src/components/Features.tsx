import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building, 
  ClipboardCheck, 
  CreditCard, 
  MessageSquare, 
  QrCode,
  Calendar,
  BarChart3,
  Shield,
  Bell,
  MapPin,
  Utensils
} from "lucide-react";

const Features = () => {
  const roleFeatures = [
    {
      role: "Admin",
      gradient: "bg-gradient-admin",
      features: [
        {
          icon: Building,
          title: "College & Hostel Setup",
          description: "Configure hostel blocks, floors, and rooms with automatic generation"
        },
        {
          icon: Users,
          title: "Warden Management", 
          description: "Add, assign, and manage wardens across hostel blocks"
        },
        {
          icon: BarChart3,
          title: "Analytics Dashboard",
          description: "Comprehensive insights on occupancy, fees, and operations"
        }
      ]
    },
    {
      role: "Warden",
      gradient: "bg-gradient-warden",
      features: [
        {
          icon: Users,
          title: "Student Management",
          description: "Add students, assign rooms, and track their information"
        },
        {
          icon: ClipboardCheck,
          title: "Attendance Tracking",
          description: "Monitor room and mess attendance with digital records"
        },
        {
          icon: MessageSquare,
          title: "Complaint Resolution",
          description: "Handle student complaints and track resolution status"
        },
        {
          icon: Calendar,
          title: "Leave Management",
          description: "Approve or reject student leave applications"
        },
        {
          icon: Utensils,
          title: "Mess Management",
          description: "Update daily menus and track meal attendance"
        },
        {
          icon: CreditCard,
          title: "Fee Tracking",
          description: "Monitor payment status and generate fee reports"
        }
      ]
    },
    {
      role: "Student",
      gradient: "bg-gradient-student",
      features: [
        {
          icon: MapPin,
          title: "Room Information",
          description: "View room details, roommate information, and hostel rules"
        },
        {
          icon: MessageSquare,
          title: "Submit Complaints",
          description: "Report issues and track complaint resolution status"
        },
        {
          icon: Calendar,
          title: "Leave Applications",
          description: "Apply for leave and track approval status"
        },
        {
          icon: Utensils,
          title: "Mess Attendance",
          description: "Mark meal preferences and view menu schedules"
        },
        {
          icon: CreditCard,
          title: "Fee Payments",
          description: "Pay hostel fees online and view payment history"
        },
        {
          icon: QrCode,
          title: "QR Code System",
          description: "Generate visitor passes and use QR codes for entry/exit"
        }
      ]
    }
  ];

  const systemFeatures = [
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Real-time alerts for complaints, approvals, and important updates",
      color: "feature-student"
    },
    {
      icon: Shield,
      title: "Role-Based Security", 
      description: "Advanced security with proper access controls for each user type",
      color: "feature-attendance"
    },
    {
      icon: BarChart3,
      title: "Comprehensive Reports",
      description: "Export detailed reports for attendance, fees, and operations",
      color: "feature-payments"
    },
    {
      icon: QrCode,
      title: "QR Integration",
      description: "Seamless QR code system for visitors and hostel access",
      color: "feature-analytics"
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background via-gradient-feature-bg to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm">Platform Features</Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-8 tracking-wide">
            Key Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Everything you need for seamless hostel management
          </p>
        </div>

        {/* Role-based features */}
        <div className="space-y-24 mb-32">
          {roleFeatures.map((roleGroup, index) => (
            <div key={roleGroup.role} className="space-y-12">
              <div className="text-center">
                <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white ${roleGroup.gradient} shadow-strong`}>
                  <Users className="h-6 w-6" />
                  <span className="font-bold text-xl">{roleGroup.role} Features</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {roleGroup.features.map((feature, featureIndex) => {
                  const IconComponent = feature.icon;
                  return (
                    <Card key={featureIndex} className="group hover:shadow-strong transition-all duration-500 hover:-translate-y-2 rounded-2xl border-0 bg-gradient-to-br from-card to-accent/5">
                      <CardHeader className="pb-4">
                        <div className={`w-16 h-16 rounded-2xl ${roleGroup.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-medium`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* System features */}
        <div className="space-y-12">
          <div className="text-center">
            <h3 className="text-3xl lg:text-4xl font-bold mb-6 tracking-wide">Built for Everyone</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Smart features that work seamlessly across all roles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {systemFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              // Use complete class names for Tailwind JIT compilation
              const bgColorClass = 
                feature.color === 'feature-student' ? 'bg-feature-student' :
                feature.color === 'feature-attendance' ? 'bg-feature-attendance' :
                feature.color === 'feature-payments' ? 'bg-feature-payments' :
                'bg-feature-analytics';
              
              return (
                <Card key={index} className="text-center group hover:shadow-strong transition-all duration-500 hover:-translate-y-2 rounded-2xl border-0">
                  <CardHeader className="pb-6">
                    <div className={`w-20 h-20 mx-auto ${bgColorClass} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-medium`}>
                      <IconComponent className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;