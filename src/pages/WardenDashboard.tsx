import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, AlertCircle, FileText, Utensils, Shield, User, ArrowLeft, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentManagement from '@/components/warden/StudentManagement';
import RoomAttendanceTracking from '@/components/warden/RoomAttendanceTracking';
import ComplaintResolution from '@/components/warden/ComplaintResolution';
import LeaveApprovals from '@/components/warden/LeaveApprovals';
import MessMenuManagement from '@/components/warden/MessMenuManagement';
import HostelRulesManagement from '@/components/warden/HostelRulesManagement';
import WardenProfile from '@/components/warden/WardenProfile';
import WardenVisitorManagement from '@/components/warden/VisitorManagement';
import FineManagement from '@/components/warden/FineManagement';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationCenter from '@/components/common/NotificationCenter';
import MessAttendanceHistoryWarden from '@/components/warden/MessAttendanceHistoryWarden';
const WardenDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [presentToday, setPresentToday] = useState<number | null>(null);
  const [pendingComplaints, setPendingComplaints] = useState<number | null>(null);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<number | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        if (!profile?.id) return;
        
        // Get warden's hostel
        const { data: warden, error: wardenError } = await supabase
          .from('wardens')
          .select('hostel_id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (wardenError) throw wardenError;
        if (!warden?.hostel_id) { 
          setTotalStudents(0);
          setPresentToday(0);
          setPendingComplaints(0);
          setPendingLeaveRequests(0);
          return; 
        }

        // Get total students count
        const { count: studentsCount, error: countError } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('hostel_id', warden.hostel_id);

        if (countError) throw countError;
        setTotalStudents(studentsCount ?? 0);

        // Get today's attendance count
        const today = new Date().toISOString().split('T')[0];
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('hostel_id', warden.hostel_id)
          .eq('date', today)
          .eq('status', 'present');

        if (!attendanceError) {
          setPresentToday(attendanceCount ?? 0);
        }

        // Get pending complaints count
        const { count: complaintsCount, error: complaintsError } = await supabase
          .from('complaints')
          .select('id', { count: 'exact', head: true })
          .eq('hostel_id', warden.hostel_id)
          .eq('status', 'pending');

        if (!complaintsError) {
          setPendingComplaints(complaintsCount ?? 0);
        }

        // Get pending leave requests count
        const { count: leaveCount, error: leaveError } = await supabase
          .from('leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('hostel_id', warden.hostel_id)
          .eq('status', 'pending');

        if (!leaveError) {
          setPendingLeaveRequests(leaveCount ?? 0);
        }

      } catch (e) {
        setTotalStudents(0);
        setPresentToday(0);
        setPendingComplaints(0);
        setPendingLeaveRequests(0);
      } finally {
        setLoading(false);
      }
    };
    
    loadCounts();
  }, [profile?.id]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to access the warden dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                <h1 className="text-xl font-bold">Warden Dashboard</h1>
                <p className="text-muted-foreground text-sm">
                  Welcome back, {profile.full_name}
                </p>
              </div>
            </div>
            <NotificationCenter />
          </div>
        </div>
      </header>
      <div className="container mx-auto p-6 overflow-y-auto">

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="bg-gradient-to-br from-student to-student/80 text-student-foreground border-0 shadow-medium rounded-2xl cursor-pointer hover:shadow-strong transition-shadow"
            onClick={() => setActiveTab('students')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Total Students</CardTitle>
              <Users className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalStudents ?? '--'}</div>
              <p className="text-xs text-white/70">Click to manage students</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-success to-success/80 text-success-foreground border-0 shadow-medium rounded-2xl cursor-pointer hover:shadow-strong transition-shadow"
            onClick={() => setActiveTab('attendance')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Present Today</CardTitle>
              <Calendar className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{presentToday ?? '--'}</div>
              <p className="text-xs text-white/70">Click to track attendance</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground border-0 shadow-medium rounded-2xl cursor-pointer hover:shadow-strong transition-shadow"
            onClick={() => setActiveTab('complaints')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Pending Complaints</CardTitle>
              <AlertCircle className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{pendingComplaints ?? '--'}</div>
              <p className="text-xs text-white/70">Click to resolve complaints</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-warning to-warning/80 text-warning-foreground border-0 shadow-medium rounded-2xl cursor-pointer hover:shadow-strong transition-shadow"
            onClick={() => setActiveTab('leave')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Leave Requests</CardTitle>
              <FileText className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{pendingLeaveRequests ?? '--'}</div>
              <p className="text-xs text-white/70">Click to approve requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start gap-1 h-12 bg-muted/50 rounded-2xl p-1">
            <TabsTrigger value="students" className="whitespace-nowrap data-[state=active]:bg-student data-[state=active]:text-student-foreground rounded-xl font-medium">Students</TabsTrigger>
            <TabsTrigger value="attendance" className="whitespace-nowrap data-[state=active]:bg-success data-[state=active]:text-success-foreground rounded-xl font-medium">Attendance</TabsTrigger>
            <TabsTrigger value="complaints" className="whitespace-nowrap data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground rounded-xl font-medium">Complaints</TabsTrigger>
            <TabsTrigger value="leave" className="whitespace-nowrap data-[state=active]:bg-warning data-[state=active]:text-warning-foreground rounded-xl font-medium">Leave Requests</TabsTrigger>
            <TabsTrigger value="visitors" className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl font-medium">Visitors</TabsTrigger>
            <TabsTrigger value="mess" className="whitespace-nowrap data-[state=active]:bg-warden data-[state=active]:text-warden-foreground rounded-xl font-medium">Mess Menu</TabsTrigger>
            <TabsTrigger value="rules" className="whitespace-nowrap data-[state=active]:bg-admin data-[state=active]:text-admin-foreground rounded-xl font-medium">Hostel Rules</TabsTrigger>
            <TabsTrigger value="fines" className="whitespace-nowrap data-[state=active]:bg-feature-analytics data-[state=active]:text-white rounded-xl font-medium">Fines</TabsTrigger>
            <TabsTrigger value="profile" className="whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-xl font-medium">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentManagement />
          </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <RoomAttendanceTracking />
              <MessAttendanceHistoryWarden />
            </TabsContent>

          <TabsContent value="complaints">
            <ComplaintResolution />
          </TabsContent>

          <TabsContent value="leave">
            <LeaveApprovals />
          </TabsContent>

          <TabsContent value="visitors">
            <WardenVisitorManagement />
          </TabsContent>

          <TabsContent value="mess">
            <MessMenuManagement />
          </TabsContent>

          <TabsContent value="rules">
            <HostelRulesManagement />
          </TabsContent>

          <TabsContent value="fines">
            <FineManagement />
          </TabsContent>

          <TabsContent value="profile">
            <WardenProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WardenDashboard;