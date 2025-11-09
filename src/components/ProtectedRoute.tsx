import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'warden' | 'student';
  allowedRoles?: ('admin' | 'warden' | 'student')[];
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowedRoles = ['admin', 'warden', 'student'] 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 shadow-medium">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center animate-pulse">
              <Building className="h-7 w-7 text-white" />
            </div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to auth if user is not authenticated
  if (!user) {
    return null; // The useEffect will handle the redirect
  }

  // Show loading if profile is not loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 shadow-medium">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center animate-pulse">
              <Building className="h-7 w-7 text-white" />
            </div>
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  const hasAccess = requiredRole ? 
    profile.role === requiredRole : 
    allowedRoles.includes(profile.role);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 shadow-medium text-center">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto">
              <Building className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
                {requiredRole && (
                  <span className="block mt-1">
                    Required role: <span className="font-medium">{requiredRole}</span>
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;