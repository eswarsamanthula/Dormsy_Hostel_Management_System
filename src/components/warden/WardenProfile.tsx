import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Building, Phone, Mail, IdCard, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface WardenData {
  id: string;
  employee_id: string;
  department: string;
  college_id: string;
  hostel_id: string;
  profile_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  colleges: {
    name: string;
    code: string;
  };
  hostels: {
    name: string;
    type: string;
  };
}

const WardenProfile = () => {
  const [wardenData, setWardenData] = useState<WardenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchWardenData();
  }, []);

  const fetchWardenData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('wardens')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email
          ),
          colleges:college_id (
            name,
            code
          ),
          hostels:hostel_id (
            name,
            type
          )
        `)
        .eq('profile_id', user?.id)
        .single();

      if (error) throw error;
      
      setWardenData(data);
      setFormData({
        full_name: data.profiles?.full_name || '',
        department: data.department || ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch warden profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update warden table
      const { error: wardenError } = await supabase
        .from('wardens')
        .update({ department: formData.department })
        .eq('profile_id', user?.id);

      if (wardenError) throw wardenError;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      fetchWardenData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const updatePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New passwords don't match");
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  if (!wardenData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load warden profile data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Warden Profile
            <Button 
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">
                {wardenData.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'W'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold">{wardenData.profiles?.full_name}</h3>
              <p className="text-muted-foreground">{wardenData.profiles?.email}</p>
              <Badge variant="outline">Warden</Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <User className="h-4 w-4 mr-2" />
                Personal Information
              </h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded-md">{wardenData.profiles?.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm p-2 bg-muted rounded-md flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {wardenData.profiles?.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g., Computer Science"
                    />
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded-md">
                      {wardenData.department || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Work Information
              </h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <p className="text-sm p-2 bg-muted rounded-md flex items-center">
                    <IdCard className="h-4 w-4 mr-2" />
                    {wardenData.employee_id}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>College</Label>
                  <p className="text-sm p-2 bg-muted rounded-md flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {wardenData.colleges?.name} ({wardenData.colleges?.code})
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Assigned Hostel</Label>
                  <p className="text-sm p-2 bg-muted rounded-md flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {wardenData.hostels?.name} ({wardenData.hostels?.type})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <Button onClick={updateProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
              />
            </div>

            <Button 
              onClick={updatePassword}
              disabled={!passwordData.newPassword || !passwordData.confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WardenProfile;