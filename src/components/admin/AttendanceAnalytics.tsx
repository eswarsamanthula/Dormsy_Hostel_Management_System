import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, TrendingUp, Users, Building, AlertTriangle } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface AttendanceStats {
  hostel_name: string;
  hostel_id: string;
  total_students: number;
  room_attendance_rate: number;
  mess_attendance_rate: number;
  absent_students: number;
}

interface TrendData {
  date: string;
  room_attendance: number;
  mess_attendance: number;
}

const AttendanceAnalytics = () => {
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedHostel, setSelectedHostel] = useState('all');
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHostels();
    fetchAttendanceStats();
    fetchTrendData();
  }, [selectedPeriod, selectedHostel]);

  const fetchHostels = async () => {
    try {
      const { data, error } = await supabase
        .from('hostels')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setHostels(data || []);
    } catch (error) {
      console.error('Error fetching hostels:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        return {
          start: format(startOfWeek(now), 'yyyy-MM-dd'),
          end: format(endOfWeek(now), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case '7days':
        return {
          start: format(subDays(now, 6), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(subDays(now, 6), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      // Get attendance statistics per hostel
      let query = supabase
        .from('attendance')
        .select(`
          hostel_id,
          room_attendance,
          mess_attendance,
          hostels!inner(name),
          students!inner(*)
        `)
        .gte('date', start)
        .lte('date', end);

      if (selectedHostel !== 'all') {
        query = query.eq('hostel_id', selectedHostel);
      }

      const { data: attendanceData, error } = await query;

      if (error) throw error;

      // Process the data to calculate statistics
      const hostelStats = new Map<string, AttendanceStats>();

      attendanceData?.forEach(record => {
        const hostelId = record.hostel_id;
        const hostelName = record.hostels?.name || 'Unknown';
        
        if (!hostelStats.has(hostelId)) {
          hostelStats.set(hostelId, {
            hostel_id: hostelId,
            hostel_name: hostelName,
            total_students: 0,
            room_attendance_rate: 0,
            mess_attendance_rate: 0,
            absent_students: 0
          });
        }

        const stats = hostelStats.get(hostelId)!;
        stats.total_students++;
        
        if (record.room_attendance) {
          stats.room_attendance_rate++;
        } else {
          stats.absent_students++;
        }
        
        if (record.mess_attendance) {
          stats.mess_attendance_rate++;
        }
      });

      // Convert to percentages
      const finalStats = Array.from(hostelStats.values()).map(stat => ({
        ...stat,
        room_attendance_rate: stat.total_students > 0 ? 
          Math.round((stat.room_attendance_rate / stat.total_students) * 100) : 0,
        mess_attendance_rate: stat.total_students > 0 ? 
          Math.round((stat.mess_attendance_rate / stat.total_students) * 100) : 0
      }));

      setStats(finalStats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('attendance')
        .select('date, room_attendance, mess_attendance')
        .gte('date', start)
        .lte('date', end);

      if (selectedHostel !== 'all') {
        query = query.eq('hostel_id', selectedHostel);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by date and calculate percentages
      const dateGroups = new Map<string, { room: number, mess: number, total: number }>();

      data?.forEach(record => {
        const date = record.date;
        if (!dateGroups.has(date)) {
          dateGroups.set(date, { room: 0, mess: 0, total: 0 });
        }
        
        const group = dateGroups.get(date)!;
        group.total++;
        
        if (record.room_attendance) group.room++;
        if (record.mess_attendance) group.mess++;
      });

      const trends = Array.from(dateGroups.entries()).map(([date, counts]) => ({
        date: format(new Date(date), 'MMM dd'),
        room_attendance: Math.round((counts.room / counts.total) * 100),
        mess_attendance: Math.round((counts.mess / counts.total) * 100)
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTrendData(trends);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const overallStats = stats.reduce(
    (acc, curr) => ({
      totalStudents: acc.totalStudents + curr.total_students,
      avgRoomAttendance: acc.avgRoomAttendance + curr.room_attendance_rate,
      avgMessAttendance: acc.avgMessAttendance + curr.mess_attendance_rate,
      totalAbsent: acc.totalAbsent + curr.absent_students
    }),
    { totalStudents: 0, avgRoomAttendance: 0, avgMessAttendance: 0, totalAbsent: 0 }
  );

  if (stats.length > 0) {
    overallStats.avgRoomAttendance = Math.round(overallStats.avgRoomAttendance / stats.length);
    overallStats.avgMessAttendance = Math.round(overallStats.avgMessAttendance / stats.length);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading attendance analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Analytics
          </CardTitle>
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                {hostels.map(hostel => (
                  <SelectItem key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{overallStats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Room Attendance</p>
                <p className="text-2xl font-bold">{overallStats.avgRoomAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Mess Attendance</p>
                <p className="text-2xl font-bold">{overallStats.avgMessAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Absent Students</p>
                <p className="text-2xl font-bold">{overallStats.totalAbsent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="room_attendance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Room Attendance"
                />
                <Line 
                  type="monotone" 
                  dataKey="mess_attendance" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Mess Attendance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hostel-wise Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Hostel-wise Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.hostel_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{stat.hostel_name}</h3>
                  <Badge variant="outline">
                    {stat.total_students} students
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Room Attendance:</span>
                    <Badge variant={stat.room_attendance_rate >= 80 ? "default" : "destructive"}>
                      {stat.room_attendance_rate}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mess Attendance:</span>
                    <Badge variant={stat.mess_attendance_rate >= 70 ? "default" : "secondary"}>
                      {stat.mess_attendance_rate}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Absent Students:</span>
                    <Badge variant={stat.absent_students === 0 ? "default" : "destructive"}>
                      {stat.absent_students}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceAnalytics;