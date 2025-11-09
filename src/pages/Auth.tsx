import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building, ArrowLeft, Shield, Users, GraduationCap, Mail, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  
  // Sign In form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up form state  
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student' as const
  });

  // Forgot Password form state
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });

  // Reset Password form state
  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });

  const { signIn, signUp, user, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated and handle password reset mode
  useEffect(() => {
    if (user && mode !== 'reset') {
      navigate('/', { replace: true });
    }
    
    // Handle password reset mode from email link
    if (mode === 'reset') {
      setActiveTab('reset-password');
    }
  }, [user, navigate, mode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      navigate('/', { replace: true });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await resetPassword(forgotPasswordData.email);
      
      if (error) {
        setError(error.message);
        return;
      }

      setResetEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Please check your email for password reset instructions.",
      });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (resetPasswordData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(resetPasswordData.password);
      
      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: "Password updated!",
        description: "Your password has been successfully updated.",
      });
      
      navigate('/', { replace: true });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.fullName,
        signUpData.role
      );
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email for a confirmation link.",
      });
      
      // Switch to sign in tab
      setActiveTab('signin');
      setSignInData({ ...signInData, email: signUpData.email });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'warden',
      label: 'Warden',
      icon: Users,
      description: 'Manage students, attendance, complaints, and hostel operations'
    },
    {
      value: 'admin',
      label: 'Administrator',
      icon: Shield,
      description: 'Full system access, college setup, and warden management'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
              <Building className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Dormsy
            </span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Welcome to Dormsy</h1>
          <p className="text-muted-foreground">
            Sign in with your provided credentials or create a new admin/warden account
          </p>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-center">
              {activeTab === 'reset-password' ? 'Reset Password' : 'Authentication'}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === 'reset-password' 
                ? 'Enter your new password' 
                : 'Sign in to your existing account or create admin/warden accounts'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {mode !== 'reset' && (
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              )}

              {error && (
                <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-primary hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select 
                      value={signUpData.role} 
                      onValueChange={(value: any) => setSignUpData({...signUpData, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              {/* Reset Password Tab */}
              <TabsContent value="reset-password" className="space-y-4">
                <div className="text-center mb-4">
                  <Key className="h-12 w-12 mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Create a new password for your account
                  </p>
                </div>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">New Password</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      placeholder="Enter your new password"
                      value={resetPasswordData.password}
                      onChange={(e) => setResetPasswordData({...resetPasswordData, password: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm">Confirm New Password</Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      placeholder="Confirm your new password"
                      value={resetPasswordData.confirmPassword}
                      onChange={(e) => setResetPasswordData({...resetPasswordData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Reset Your Password
              </DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            
            {resetEmailSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{forgotPasswordData.email}</strong>
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    setForgotPasswordData({ email: '' });
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordData.email}
                    onChange={(e) => setForgotPasswordData({...forgotPasswordData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            By signing up, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;