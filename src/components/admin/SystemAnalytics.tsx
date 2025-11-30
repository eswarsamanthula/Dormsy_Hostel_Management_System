import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { Building, Users, Home, TrendingUp, UserCheck, AlertTriangle } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const SystemAnalytics = () => {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [
        { data: colleges },
        { data: hostels },
        { data: students },
        { data: wardens },
        { data: complaints },
        { data: leaveRequests },
        { data: attendance }
      ] = await Promise.all([
        supabase.from('colleges').select('id, name'),
        supabase.from('hostels').select('id, name, type, current_occupancy, total_capacity, college_id'),
        supabase.from('students').select('id, college_id, hostel_id'),
        supabase.from('wardens').select('id, college_id, hostel_id'),
        supabase.from('complaints').select('id, status, priority, created_at'),
        supabase.from('leave_requests').select('id, status, created_at'),
        supabase.from('attendance').select('id, date, room_attendance, mess_attendance')
      ]);

      const totalStudents = students?.length || 0;
      const totalWardens = wardens?.length || 0;
      const totalHostels = hostels?.length || 0;
      const totalColleges = colleges?.length || 0;
      
      const occupancyRate = hostels?.reduce((acc, h) => acc + (h.current_occupancy / h.total_capacity || 0), 0) / (hostels?.length || 1);
      
      const complaintsData = complaints?.reduce((acc: any, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const hostelOccupancy = hostels?.map(h => ({
        name: h.name,
        occupancy: h.current_occupancy,
        capacity: h.total_capacity,
        rate: h.total_capacity ? (h.current_occupancy / h.total_capacity * 100) : 0
      })) || [];

      const hostelTypes = hostels?.reduce((acc: any, h: any) => {
        acc[h.type] = (acc[h.type] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        kpis: {
          totalStudents,
          totalWardens,
          totalHostels,
          totalColleges,
          occupancyRate: Math.round(occupancyRate * 100),
          activeComplaints: complaints?.filter(c => c.status === 'pending').length || 0
        },
        charts: {
          complaints: Object.entries(complaintsData).map(([status, count]) => ({ name: status, value: count })),
          hostelOccupancy,
          hostelTypes: Object.entries(hostelTypes).map(([type, count]) => ({ name: type, value: count }))
        }
      };
    }
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{analytics?.kpis.totalStudents || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hostels</p>
                <p className="text-2xl font-bold">{analytics?.kpis.totalHostels || 0}</p>
              </div>
              <Home className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold">{analytics?.kpis.occupancyRate || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Wardens</p>
                <p className="text-2xl font-bold">{analytics?.kpis.totalWardens || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Complaints</p>
                <p className="text-2xl font-bold">{analytics?.kpis.activeComplaints || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Colleges</p>
                <p className="text-2xl font-bold">{analytics?.kpis.totalColleges || 0}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hostel Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.charts.hostelOccupancy || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="occupancy" fill="hsl(var(--primary))" />
                  <Bar dataKey="capacity" fill="hsl(var(--muted))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complaints Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.charts.complaints || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics?.charts.complaints?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemAnalytics;