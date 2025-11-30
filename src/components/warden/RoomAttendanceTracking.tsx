import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Check, X, Users, Building, Home } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface RoomAttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  room_attendance?: boolean;
  mess_attendance?: boolean;  
  status?: 'present' | 'absent' | 'skipped';
  students: {
    student_id: string;
    profiles: {
      full_name: string;
    };
    rooms: {
      room_number: string;
      floor_number: number;
    };
  };
}

interface StudentWithoutRecord {
  id: string;
  student_id: string;
  profiles: {
    full_name: string;
  };
  rooms: {
    room_number: string;
    floor_number: number;
  };
}

const RoomAttendanceTracking = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<RoomAttendanceRecord[]>([]);
  const [studentsWithoutRecords, setStudentsWithoutRecords] = useState<StudentWithoutRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [floors, setFloors] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchRoomAttendance();
    fetchFloors();
  }, [selectedDate, selectedFloor]);

  const fetchFloors = async () => {
    try {
      const { data: warden } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', profile?.id)
        .single();

      if (warden) {
        const { data: rooms } = await supabase
          .from('rooms')
          .select('floor_number')
          .eq('hostel_id', warden.hostel_id);

        const uniqueFloors = [...new Set(rooms?.map(r => r.floor_number) || [])].sort();
        setFloors(uniqueFloors);
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
    }
  };

  const fetchRoomAttendance = async () => {
    try {
      setLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      const { data: warden } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', profile?.id)
        .single();

      if (!warden) return;

      // Build the query for attendance records
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          *,
          students:student_id (
            id,
            student_id,
            profiles:profile_id (
              full_name
            ),
            rooms:room_id (
              room_number,
              floor_number
            )
          )
        `)
        .eq('date', dateString)
        .eq('hostel_id', warden.hostel_id)
        .eq('attendance_type', 'room');

      // Build the query for students without records
      let studentsQuery = supabase
        .from('students')
        .select(`
          id,
          student_id,
          profiles:profile_id (
            full_name
          ),
          rooms:room_id (
            room_number,
            floor_number
          )
        `)
        .eq('hostel_id', warden.hostel_id);

      // Apply floor filter if selected
      if (selectedFloor !== 'all') {
        const floorNumber = parseInt(selectedFloor);
        // Note: Floor filtering will be implemented after schema update
      }

      const [attendanceResult, studentsResult] = await Promise.all([
        attendanceQuery.order('created_at', { ascending: false }),
        studentsQuery
      ]);

      if (attendanceResult.error) throw attendanceResult.error;
      if (studentsResult.error) throw studentsResult.error;

      const rawRecords = attendanceResult.data || [];
      // Deduplicate by student_id (keep latest by updated_at/created_at)
      const dedupMap = new Map<string, any>();
      for (const r of rawRecords) {
        const key = r.student_id;
        const existing = dedupMap.get(key);
        const currTs = new Date(r.updated_at || r.created_at || r.date).getTime();
        const prevTs = existing ? new Date(existing.updated_at || existing.created_at || existing.date).getTime() : -1;
        if (!existing || currTs >= prevTs) dedupMap.set(key, r);
      }
      const attendanceRecords = Array.from(dedupMap.values()).map((record: any) => ({
        ...record,
        status: record.status as 'present' | 'absent' | 'skipped'
      }));
      const allStudents = studentsResult.data || [];

      // Find students without attendance records for today
      const recordedStudentIds = new Set(attendanceRecords.map(r => r.student_id));
      const studentsWithoutRecords = allStudents.filter(s => !recordedStudentIds.has(s.id));

      setAttendanceRecords(attendanceRecords);
      setStudentsWithoutRecords(studentsWithoutRecords);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch room attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent') => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Get student info to get college_id and hostel_id
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('college_id, hostel_id')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      
      // Check if there's an existing room attendance record for today
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', dateString)
        .eq('attendance_type', 'room')
        .maybeSingle();

      if (fetchError) throw fetchError;

      let error;
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            status: status,
            room_attendance: status === 'present',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date: dateString,
            college_id: student.college_id,
            hostel_id: student.hostel_id,
            attendance_type: 'room',
            status: status,
            room_attendance: status === 'present'
          });
        error = insertError;
      }

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Room attendance marked as ${status}`,
      });
      
      fetchRoomAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    }
  };

  const generateDailyRecords = async () => {
    try {
      toast({
        title: "Info",
        description: "Daily record generation feature will be available after database update",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate attendance records",
        variant: "destructive",
      });
    }
  };

  const markAllPresent = () => {
    // Combine both arrays and mark all students present
    const allStudentRecords = [
      ...attendanceRecords.map(r => ({ id: r.student_id, type: 'attendance' })),
      ...studentsWithoutRecords.map(s => ({ id: s.id, type: 'student' }))
    ];
    
    allStudentRecords.forEach(record => {
      markAttendance(record.id, 'present');
    });
  };

  const markAllAbsent = () => {
    // Combine both arrays and mark all students absent
    const allStudentRecords = [
      ...attendanceRecords.map(r => ({ id: r.student_id, type: 'attendance' })),
      ...studentsWithoutRecords.map(s => ({ id: s.id, type: 'student' }))
    ];
    
    allStudentRecords.forEach(record => {
      markAttendance(record.id, 'absent');
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading room attendance...</div>
        </CardContent>
      </Card>
    );
  }

  const totalStudents = attendanceRecords.length + studentsWithoutRecords.length;
  const presentCount = attendanceRecords.filter(r => r.room_attendance || r.status === 'present').length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Room Attendance Tracking
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={generateDailyRecords} variant="outline" size="sm">
                Generate Records
              </Button>
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
            </div>
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    Floor {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={markAllPresent} variant="outline" size="sm">
                Mark All Present
              </Button>
              <Button onClick={markAllAbsent} variant="outline" size="sm">
                Mark All Absent
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">{totalStudents - presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Room Attendance for {format(selectedDate, 'PP')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Students with existing records */}
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.students?.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.students?.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.students?.rooms?.room_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      Floor {record.students?.rooms?.floor_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        (record.status === 'present' || record.room_attendance) ? 'default' : 
                        (record.status === 'absent' || record.room_attendance === false) ? 'destructive' : 'secondary'
                      }>
                        {(record.status === 'present' || record.room_attendance) ? 'Present' : 
                         (record.status === 'absent' || record.room_attendance === false) ? 'Absent' : 'Not Marked'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={(record.status === 'present' || record.room_attendance) ? "default" : "outline"}
                          onClick={() => markAttendance(record.student_id, 'present')}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={(record.status === 'absent' || record.room_attendance === false) ? "destructive" : "outline"}
                          onClick={() => markAttendance(record.student_id, 'absent')}
                        >
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Students without records */}
                {studentsWithoutRecords.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {student.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.rooms?.room_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      Floor {student.rooms?.floor_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Not Marked</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAttendance(student.id, 'present')}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAttendance(student.id, 'absent')}
                        >
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalStudents === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No students found for the selected criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomAttendanceTracking;