import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Coffee, Sun, Moon, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface MessAttendanceRecord {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  status: 'attending' | 'skipping';
  created_at: string;
  updated_at: string;
}

const MessAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<MessAttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchStudentInfo();
  }, [profile]);

  useEffect(() => {
    if (student) {
      initializeMessAttendance();
    }
  }, [selectedDate, student]);

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

  const initializeMessAttendance = async () => {
    try {
      setLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Generate daily records if they don't exist
      await generateDailyMessRecords(dateString);
      
      // Fetch existing attendance records from database  
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)
        .eq('date', dateString)
        .eq('attendance_type', 'mess');

      console.log('Fetched attendance data:', attendanceData, 'Error:', error);
      
      // Convert database records to UI format
      const meals = ['breakfast', 'lunch', 'dinner'] as const;
      const records = meals.map(meal => {
        const dbRecord = attendanceData?.find((r: any) => r.meal_type === meal);
        
        return {
          id: dbRecord?.id || `temp-${meal}-${dateString}`,
          date: dateString,
          meal_type: meal,
          status: (dbRecord?.status === 'present' || dbRecord?.mess_attendance) ? 'attending' as const : 'skipping' as const,
          created_at: dbRecord?.created_at || new Date().toISOString(),
          updated_at: dbRecord?.updated_at || new Date().toISOString()
        };
      });
      
      setAttendanceRecords(records);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load mess attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessAttendance = async (mealType: 'breakfast' | 'lunch' | 'dinner', status: 'attending' | 'skipping') => {
    try {
      // Check cut-off times
      if (!canMarkAttendance(mealType)) {
        toast({
          title: "Cut-off Time Passed",
          description: `Cannot mark ${mealType} attendance after cut-off time`,
          variant: "destructive",
        });
        return;
      }

      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Update attendance in database
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', student.id)
        .eq('date', dateString)
        .eq('attendance_type', 'mess')
        .eq('meal_type', mealType)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let error;
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            status: status === 'attending' ? 'present' : 'absent',
            mess_attendance: status === 'attending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
        error = updateError;
      } else {
        // Insert new record with required profile checks
        if (!student?.college_id || !student?.hostel_id) {
          toast({
            title: 'Profile incomplete',
            description: 'Your college/hostel information is missing. Please contact admin to assign your hostel.',
            variant: 'destructive',
          });
          return;
        }
        const { error: insertError } = await supabase
          .from('attendance')
          .insert({
            student_id: student.id,
            date: dateString,
            college_id: student.college_id,
            hostel_id: student.hostel_id,
            attendance_type: 'mess',
            meal_type: mealType,
            status: status === 'attending' ? 'present' : 'absent',
            mess_attendance: status === 'attending'
          });
        error = insertError;
      }

      if (error) throw error;

      // Update local state
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.meal_type === mealType 
            ? { ...record, status, updated_at: new Date().toISOString() }
            : record
        )
      );
      
      toast({
        title: "Success",
        description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} attendance updated`,
      });
      
      } catch (error: any) {
        console.error('updateMessAttendance error:', error);
        toast({
          title: "Error",
          description: error?.message ? `Failed: ${error.message}` : "Failed to update mess attendance",
          variant: "destructive",
        });
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

  const generateDailyMessRecords = async (dateString: string) => {
    try {
      // This will be implemented after database schema is finalized
      console.log('Generating records for', dateString);
    } catch (error) {
      console.error('Error generating daily records:', error);
    }
  };

  const canMarkAttendance = (mealType: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    
    if (!isToday) return false;
    
    // Allow marking attendance until the meal period ends
    switch (mealType) {
      case 'breakfast': return currentHour < 10; // Until 10 AM
      case 'lunch': return currentHour < 15; // Until 3 PM (15:00)
      case 'dinner': return currentHour < 22; // Until 10 PM (22:00)
      default: return false;
    }
  };

  const isCurrentMealActive = (mealType: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    
    if (!isToday) return false;
    
    switch (mealType) {
      case 'breakfast': return currentHour >= 6 && currentHour < 10;
      case 'lunch': return currentHour >= 11 && currentHour < 15;
      case 'dinner': return currentHour >= 18 && currentHour < 22;
       default: return false;
    }
  };

  const markAllTodayAttending = async () => {
    const meals: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
    for (const meal of meals) {
      if (canMarkAttendance(meal)) {
        await updateMessAttendance(meal, 'attending');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading mess attendance...</div>
        </CardContent>
      </Card>
    );
  }

  const totalMeals = attendanceRecords.length;
  const attendingCount = attendanceRecords.filter(r => r.status === 'attending').length;
  const skippingCount = attendanceRecords.filter(r => r.status === 'skipping').length;

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Mess Attendance
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{format(selectedDate, 'PPP')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Attending</p>
                <p className="text-2xl font-bold">{attendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Skipping</p>
                <p className="text-2xl font-bold">{skippingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coffee className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Meals</p>
                <p className="text-2xl font-bold">{totalMeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-end">
        <Button size="sm" onClick={markAllTodayAttending} className="whitespace-nowrap">
          <Check className="h-4 w-4 mr-2" /> Mark all meals as Attending
        </Button>
      </div>

      {/* Meal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {attendanceRecords.map((record) => {
          const isActive = isCurrentMealActive(record.meal_type);
          
          return (
            <Card key={record.meal_type} className={`relative ${isActive ? 'ring-2 ring-primary' : ''}`}>
              {isActive && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Clock className="h-3 w-3" />
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    {getMealIcon(record.meal_type)}
                    {record.meal_type.charAt(0).toUpperCase() + record.meal_type.slice(1)}
                  </span>
                  <Badge variant={
                    record.status === 'attending' ? 'default' : 'secondary'
                  }>
                    {record.status === 'attending' ? 'Attending' : 'Skipping'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getMealTime(record.meal_type)}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={record.status === 'attending' ? "default" : "outline"}
                    onClick={() => updateMessAttendance(record.meal_type, 'attending')}
                    className="flex-1"
                    disabled={!canMarkAttendance(record.meal_type)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    I'm Coming
                  </Button>
                  <Button
                    size="sm"
                    variant={record.status === 'skipping' ? "secondary" : "outline"}
                    onClick={() => updateMessAttendance(record.meal_type, 'skipping')}
                    className="flex-1"
                    disabled={!canMarkAttendance(record.meal_type)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </div>
                {isActive && (
                  <p className="text-xs text-primary mt-2 text-center font-medium">
                    Current meal time - Mark your attendance!
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History for {format(selectedDate, 'PP')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendanceRecords.map((record) => (
              <div key={record.meal_type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getMealIcon(record.meal_type)}
                  <div>
                    <p className="font-medium">
                      {record.meal_type.charAt(0).toUpperCase() + record.meal_type.slice(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getMealTime(record.meal_type)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={
                    record.status === 'attending' ? 'default' : 'secondary'
                  }>
                    {record.status === 'attending' ? 'Attending' : 'Skipping'}
                  </Badge>
                  {record.updated_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated: {format(new Date(record.updated_at), 'h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessAttendance;