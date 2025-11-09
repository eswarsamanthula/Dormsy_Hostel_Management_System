import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Home, 
  AlertCircle, 
  Calendar, 
  CreditCard,
  ChefHat,
  BookOpen,
  MapPin,
  Phone,
  User,
  Building,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ComplaintForm from '@/components/student/ComplaintForm';
import LeaveRequestForm from '@/components/student/LeaveRequestForm';
import FeeRecords from '@/components/student/FeeRecords';
import MessMenu from '@/components/student/MessMenu';
import MessAttendance from '@/components/student/MessAttendance';
import MessQRAttendance from '@/components/student/MessQRAttendance';

import HostelRules from '@/components/student/HostelRules';
import QRCode from '@/components/student/QRCode';
import VisitorManagement from '@/components/student/VisitorManagement';
import StudentFines from '@/components/student/StudentFines';
import PaymentHistory from '@/components/PaymentHistory';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationCenter from '@/components/common/NotificationCenter';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [hostel, setHostel] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [college, setCollege] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStudentData();
  }, [profile]);

  const fetchStudentData = async () => {
    if (!profile?.id) return;
    
    try {
      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (studentError && studentError.code !== 'PGRST116') {
        throw studentError;
      }

      if (studentData) {
        setStudent(studentData);

        // Fetch hostel data
        if (studentData.hostel_id) {
          const { data: hostelData, error: hostelError } = await supabase
            .from('hostels')
            .select('*')
            .eq('id', studentData.hostel_id)
            .maybeSingle();

          if (hostelError) throw hostelError;
          setHostel(hostelData);
        }

        // Fetch room data
        if (studentData.room_id) {
          const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', studentData.room_id)
            .maybeSingle();

          if (roomError) throw roomError;
          setRoom(roomData);
        }

        // Fetch college data
        if (studentData.college_id) {
          const { data: collegeData, error: collegeError } = await supabase
            .from('colleges')
            .select('*')
            .eq('id', studentData.college_id)
            .maybeSingle();

          if (collegeError) throw collegeError;
          setCollege(collegeData);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load student information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-primary/10 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Student Profile Not Found</CardTitle>
            <CardDescription>
              Your student profile hasn't been set up yet. Please contact your administrator to complete your enrollment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Student Portal
                </span>
                <Badge variant="outline" className="ml-2 text-xs">Dormsy</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Badge variant="secondary">Student ID: {student.student_id}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-student rounded-2xl p-6 text-white shadow-medium">
              <div className="flex items-center gap-4 mb-4">
                <GraduationCap className="h-10 w-10" />
                <div>
                  <h1 className="text-2xl font-bold">Welcome, {profile?.full_name}</h1>
                  <p className="text-white/90">{student.course} - Year {student.year_of_study}</p>
                </div>
              </div>
              
              {/* Quick Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div 
                  className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setActiveTab('overview')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5" />
                    <span className="font-medium">College</span>
                  </div>
                  <p className="text-white/90">{college?.name || 'Not assigned'}</p>
                </div>
                <div 
                  className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setActiveTab('overview')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Hostel</span>
                  </div>
                  <p className="text-white/90">{hostel?.name || 'Not assigned'}</p>
                </div>
                <div 
                  className="bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setActiveTab('overview')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Room</span>
                  </div>
                  <p className="text-white/90">
                    {room ? `${room.room_number} (Floor ${room.floor_number})` : 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="inline-flex w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start gap-1 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="complaints" className="whitespace-nowrap">Complaints</TabsTrigger>
              <TabsTrigger value="leaves" className="whitespace-nowrap">Leave Requests</TabsTrigger>
              <TabsTrigger value="fees" className="whitespace-nowrap">Fee Records</TabsTrigger>
              <TabsTrigger value="mess" className="whitespace-nowrap">Mess Menu</TabsTrigger>
              <TabsTrigger value="mess-attendance" className="whitespace-nowrap">Mess Attendance</TabsTrigger>
              <TabsTrigger value="rules" className="whitespace-nowrap">Hostel Rules</TabsTrigger>
              <TabsTrigger value="qr" className="whitespace-nowrap">QR Codes</TabsTrigger>
              <TabsTrigger value="visitors" className="whitespace-nowrap">Visitors</TabsTrigger>
              <TabsTrigger value="fines" className="whitespace-nowrap">Fines</TabsTrigger>
              <TabsTrigger value="payments" className="whitespace-nowrap">Payment History</TabsTrigger>
          </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profile?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student ID</p>
                      <p className="font-medium">{student.student_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Course</p>
                      <p className="font-medium">{student.course}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year of Study</p>
                      <p className="font-medium">Year {student.year_of_study}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Guardian Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Guardian Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Guardian Name</p>
                      <p className="font-medium">{student.guardian_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guardian Phone</p>
                      <p className="font-medium">{student.guardian_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">{student.emergency_contact || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="complaints">
              <ComplaintForm student={student} />
            </TabsContent>

            <TabsContent value="leaves">
              <LeaveRequestForm student={student} />
            </TabsContent>

            <TabsContent value="fees">
              <FeeRecords student={student} />
            </TabsContent>

            <TabsContent value="mess">
              <MessMenu hostelId={student.hostel_id} />
            </TabsContent>

            <TabsContent value="rules">
              <HostelRules hostelId={student.hostel_id} />
            </TabsContent>
            
            <TabsContent value="qr">
              <QRCode studentId={student.student_id} studentData={student} />
            </TabsContent>
            
            <TabsContent value="visitors">
              <VisitorManagement studentId={student.id} studentData={student} />
            </TabsContent>
            
            <TabsContent value="mess-attendance">
              <div className="space-y-6">
                <MessAttendance />
                <MessQRAttendance />
              </div>
            </TabsContent>

            <TabsContent value="fines">
              <ErrorBoundary>
                <StudentFines />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="payments">
              <ErrorBoundary>
                <PaymentHistory />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;