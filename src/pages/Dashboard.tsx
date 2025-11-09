import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  Shield, 
  GraduationCap, 
  LogOut,
  Settings,
  BarChart3,
  Bell,
  Home,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '@/components/common/NotificationCenter';

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getRoleConfig = () => {
    switch (profile?.role) {
      case 'admin':
        return {
          title: 'Administrator Dashboard',
          icon: Shield,
          gradient: 'bg-gradient-admin',
          description: 'Manage colleges, hostels, wardens, and system-wide operations',
          features: [
            { name: 'College & Hostel Management', available: true, path: '/admin' },
            { name: 'Warden Assignment', available: true, path: '/admin' }, 
            { name: 'System Analytics', available: true, path: '/admin' },
            { name: 'User Management', available: true, path: '/admin' },
            { name: 'Reports & Insights', available: true, path: '/admin' }
          ]
        };
      case 'warden':
        return {
          title: 'Warden Dashboard',
          icon: Users,
          gradient: 'bg-gradient-warden',
          description: 'Manage students, attendance, complaints, and daily operations',
          features: [
            { name: 'Student Management', available: true, path: '/warden' },
            { name: 'Attendance Tracking', available: true, path: '/warden' },
            { name: 'Complaint Resolution', available: true, path: '/warden' },
            { name: 'Leave Approvals', available: true, path: '/warden' },
            { name: 'Mess Management', available: true, path: '/warden' }
          ]
        };
      case 'student':
        return {
          title: 'Student Dashboard',
          icon: GraduationCap,
          gradient: 'bg-gradient-student',
          description: 'Access your room information, submit complaints, and manage fees',
          features: [
            { name: 'Room Information', available: true, path: '/student' },
            { name: 'Submit Complaints', available: true, path: '/student' },
            { name: 'Leave Applications', available: true, path: '/student' },
            { name: 'Fee Payments', available: true, path: '/student' },
            { name: 'Mess Menu & Rules', available: true, path: '/student' }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          icon: Home,
          gradient: 'bg-gradient-primary',
          description: 'Welcome to Dormsy',
          features: []
        };
    }
  };

  const roleConfig = getRoleConfig();
  const IconComponent = roleConfig.icon;

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Dormsy
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:flex">
                {profile?.role}
              </Badge>
              <NotificationCenter />
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={handleSignOut} disabled={isLoading}>
                <LogOut className="h-4 w-4 mr-2" />
                {isLoading ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-6">
            <div className={`inline-flex items-center gap-4 px-6 py-4 rounded-2xl text-white ${roleConfig.gradient} shadow-medium`}>
              <IconComponent className="h-8 w-8" />
              <div className="text-left">
                <h1 className="text-2xl font-bold">{roleConfig.title}</h1>
                <p className="text-white/90">Welcome back, {profile?.full_name || profile?.email}</p>
              </div>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {roleConfig.description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleConfig.features.map((feature: any, index: number) => (
              <Card key={index} className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${roleConfig.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    {feature.name || feature}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Click below to access this feature and manage your {profile?.role} tasks.
                  </CardDescription>
                  <Button 
                    variant="default"
                    className="w-full mt-4" 
                    onClick={() => feature.path && navigate(feature.path)}
                  >
                    Access Feature
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;