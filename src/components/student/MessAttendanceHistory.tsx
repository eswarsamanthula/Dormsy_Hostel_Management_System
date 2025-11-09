import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Coffee, Sun, Moon, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceRecord {
  id: string;
  date: string;
  meal_type: string;
  status: string;
  mess_attendance: boolean;
  created_at: string;
}

const MessAttendanceHistory = () => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchStudentInfo();
  }, [profile]);

  useEffect(() => {
    if (student) {
      fetchAttendanceHistory();
    }
  }, [student, selectedDate]);

  const fetchStudentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const startDate = format(subDays(selectedDate, 7), 'yyyy-MM-dd');
      const endDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)
        .eq('attendance_type', 'mess')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendanceHistory(data || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="h-4 w-4" />;
      case 'lunch': return <Sun className="h-4 w-4" />;
      case 'dinner': return <Moon className="h-4 w-4" />;
      default: return <Coffee className="h-4 w-4" />;
    }
  };

  const getMealTime = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '7:00 AM - 9:00 AM';
      case 'lunch': return '12:00 PM - 2:00 PM';
      case 'dinner': return '7:00 PM - 9:00 PM';
      default: return '';
    }
  };

  const groupedHistory = attendanceHistory.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Mess Attendance History
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Last 7 days from {format(selectedDate, 'PP')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading attendance history...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedHistory).length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No attendance records found for the selected period.
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedHistory).map(([date, records]) => (
              <Card key={date}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const record = records.find(r => r.meal_type === mealType);
                      const isPresent = record?.status === 'present' || record?.mess_attendance;
                      
                      return (
                        <div key={mealType} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getMealIcon(mealType)}
                            <div>
                              <p className="font-medium capitalize">{mealType}</p>
                              <p className="text-xs text-muted-foreground">
                                {getMealTime(mealType)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {record ? (
                              <Badge variant={isPresent ? 'default' : 'secondary'}>
                                {isPresent ? 'Present' : 'Absent'}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                            {record && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(record.created_at), 'h:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MessAttendanceHistory;