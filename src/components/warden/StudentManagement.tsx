import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Phone, Mail, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  student_id: string;
  profile_id: string;
  course: string;
  year_of_study: number;
  room_id: string;
  guardian_name: string;
  guardian_phone: string;
  emergency_contact: string;
  profiles: {
    full_name: string;
    email: string;
  };
  rooms: {
    room_number: string;
    floor_number: number;
  };
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    student_id: '',
    course: '',
    year_of_study: '',
    room_id: '',
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchAvailableRooms();
  }, []);

  const fetchStudents = async () => {
    try {
      // Get current warden's hostel to filter students
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', user?.id)
        .single();

      if (!wardenData) throw new Error('Warden information not found');

      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles!inner (
            full_name,
            email
          ),
          rooms (
            room_number,
            floor_number
          )
        `)
        .eq('hostel_id', wardenData.hostel_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      // Limit rooms to the current warden's hostel
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, floor_number, capacity, current_occupancy')
        .eq('hostel_id', wardenData?.hostel_id)
        .order('floor_number', { ascending: true })
        .order('room_number', { ascending: true });

      if (error) throw error;
      
      // Filter rooms with available capacity
      const availableRooms = (data || []).filter(room => room.current_occupancy < room.capacity);
      setAvailableRooms(availableRooms);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch available rooms",
        variant: "destructive",
      });
    }
  };

  const addStudent = async () => {
    try {
      // Get current warden's college and hostel info
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData, error: wardenError } = await supabase
        .from('wardens')
        .select('college_id, hostel_id')
        .eq('profile_id', user?.id)
        .single();

      if (wardenError || !wardenData) throw new Error('Unable to get warden information');

      // Generate student credentials using edge function
      const { data: credentialsData, error: credentialsError } = await supabase.functions.invoke(
        'generate-user-credentials',
        {
          body: {
            role: 'student',
            collegeId: wardenData.college_id,
            count: 1,
            studentData: {
              full_name: newStudent.full_name
            }
          }
        }
      );

      if (credentialsError) {
        console.error('Credentials error:', credentialsError);
        throw new Error(credentialsError.message || 'Failed to generate credentials');
      }

      if (!credentialsData?.credentials?.[0]) {
        throw new Error('No credentials returned from server');
      }

      const credentials = credentialsData.credentials[0];

      // Create student record with the auth user ID from the edge function
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          profile_id: credentials.authUserId,
          student_id: credentials.userId,
          course: newStudent.course,
          year_of_study: parseInt(newStudent.year_of_study),
          room_id: newStudent.room_id === 'no-room' ? null : newStudent.room_id,
          guardian_name: newStudent.guardian_name,
          guardian_phone: newStudent.guardian_phone,
          emergency_contact: newStudent.emergency_contact,
          college_id: wardenData.college_id,
          hostel_id: wardenData.hostel_id
        });

      if (studentError) throw studentError;

      // Show credentials to warden
      toast({
        title: "Student Created Successfully",
        description: `Student credentials:\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nStudent ID: ${credentials.userId}`,
        duration: 15000,
      });

      // Room occupancy is now handled automatically by database trigger

      setIsAddDialogOpen(false);
      setNewStudent({
        full_name: '',
        email: '',
        student_id: '',
        course: '',
        year_of_study: '',
        room_id: '',
        guardian_name: '',
        guardian_phone: '',
        emergency_contact: ''
      });
      fetchStudents();
      fetchAvailableRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    }
  };

  const editStudent = async () => {
    if (!selectedStudent) return;
    
    try {
      // Update student record
      const { error: studentError } = await supabase
        .from('students')
        .update({
          course: newStudent.course,
          year_of_study: parseInt(newStudent.year_of_study),
          room_id: newStudent.room_id === 'no-room' ? null : newStudent.room_id,
          guardian_name: newStudent.guardian_name,
          guardian_phone: newStudent.guardian_phone,
          emergency_contact: newStudent.emergency_contact,
        })
        .eq('id', selectedStudent.id);

      if (studentError) throw studentError;

      // Update profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: newStudent.full_name,
          email: newStudent.email,
        })
        .eq('id', selectedStudent.profile_id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Student updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      setNewStudent({
        full_name: '',
        email: '',
        student_id: '',
        course: '',
        year_of_study: '',
        room_id: '',
        guardian_name: '',
        guardian_phone: '',
        emergency_contact: ''
      });
      fetchStudents();
      fetchAvailableRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    }
  };

  const deleteStudent = async (student: Student) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      // Room occupancy is now handled automatically by database trigger
      
      // Delete student record
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (studentError) throw studentError;

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });

      fetchStudents();
      fetchAvailableRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  const openViewDialog = (student: Student) => {
    setSelectedStudent(student);
    setGeneratedPassword(null); // Reset password when opening dialog
    setIsViewDialogOpen(true);
  };

  const resetPassword = async () => {
    if (!selectedStudent) return;
    
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-student-password', {
        body: {
          userId: selectedStudent.profile_id,
          studentId: selectedStudent.student_id
        }
      });

      if (error) throw error;

      if (data?.password) {
        setGeneratedPassword(data.password);
        toast({
          title: "Password Reset Successfully",
          description: "New password has been generated and displayed below. Please save it securely.",
          duration: 10000,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const openEditDialog = async (student: Student) => {
    setSelectedStudent(student);
    setNewStudent({
      full_name: student.profiles?.full_name || '',
      email: student.profiles?.email || '',
      student_id: student.student_id,
      course: student.course || '',
      year_of_study: student.year_of_study?.toString() || '',
      room_id: student.room_id || 'no-room',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      emergency_contact: student.emergency_contact || ''
    });
    
    // Fetch available rooms including current room
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, floor_number, capacity, current_occupancy')
        .eq('hostel_id', wardenData?.hostel_id)
        .order('floor_number', { ascending: true })
        .order('room_number', { ascending: true });

      if (error) throw error;
      
      // Include student's current room even if at capacity, plus other available rooms
      const availableRooms = (data || []).filter(room => 
        room.current_occupancy < room.capacity || room.id === student.room_id
      );
      setAvailableRooms(availableRooms);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch available rooms",
        variant: "destructive",
      });
    }
    
    setIsEditDialogOpen(true);
  };

  const filteredStudents = students.filter(student =>
    student.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading students...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Management</CardTitle>
        <div className="flex items-center justify-between space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student account with automatically generated credentials
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={newStudent.full_name}
                    onChange={(e) => setNewStudent({...newStudent, full_name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    placeholder="student@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input
                    id="student_id"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                    placeholder="STU001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    value={newStudent.course}
                    onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_of_study">Year of Study</Label>
                  <Select value={newStudent.year_of_study} onValueChange={(value) => setNewStudent({...newStudent, year_of_study: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_id">Room Assignment</Label>
                  <Select value={newStudent.room_id} onValueChange={(value) => setNewStudent({...newStudent, room_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-room">No room assigned</SelectItem>
                      {availableRooms.map((room: any) => (
                        <SelectItem key={room.id} value={room.id || "no-room"}>
                          Room {room.room_number} (Floor {room.floor_number}) - {room.capacity - room.current_occupancy} spots available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name</Label>
                  <Input
                    id="guardian_name"
                    value={newStudent.guardian_name}
                    onChange={(e) => setNewStudent({...newStudent, guardian_name: e.target.value})}
                    placeholder="Guardian full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone</Label>
                  <Input
                    id="guardian_phone"
                    value={newStudent.guardian_phone}
                    onChange={(e) => setNewStudent({...newStudent, guardian_phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={newStudent.emergency_contact}
                    onChange={(e) => setNewStudent({...newStudent, emergency_contact: e.target.value})}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addStudent}>
                  Add Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>
                  Update student information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={newStudent.full_name}
                    onChange={(e) => setNewStudent({...newStudent, full_name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    placeholder="student@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_student_id">Student ID</Label>
                  <Input
                    id="edit_student_id"
                    value={newStudent.student_id}
                    disabled
                    placeholder="STU001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_course">Course</Label>
                  <Input
                    id="edit_course"
                    value={newStudent.course}
                    onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_year_of_study">Year of Study</Label>
                  <Select value={newStudent.year_of_study} onValueChange={(value) => setNewStudent({...newStudent, year_of_study: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_room_id">Room Assignment</Label>
                  <Select value={newStudent.room_id} onValueChange={(value) => setNewStudent({...newStudent, room_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-room">No room assigned</SelectItem>
                      {availableRooms.map((room: any) => (
                        <SelectItem key={room.id} value={room.id || "no-room"}>
                          Room {room.room_number} (Floor {room.floor_number}) - {room.capacity - room.current_occupancy} spots available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_guardian_name">Guardian Name</Label>
                  <Input
                    id="edit_guardian_name"
                    value={newStudent.guardian_name}
                    onChange={(e) => setNewStudent({...newStudent, guardian_name: e.target.value})}
                    placeholder="Guardian full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_guardian_phone">Guardian Phone</Label>
                  <Input
                    id="edit_guardian_phone"
                    value={newStudent.guardian_phone}
                    onChange={(e) => setNewStudent({...newStudent, guardian_phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_emergency_contact">Emergency Contact</Label>
                  <Input
                    id="edit_emergency_contact"
                    value={newStudent.emergency_contact}
                    onChange={(e) => setNewStudent({...newStudent, emergency_contact: e.target.value})}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editStudent}>
                  Update Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
                <DialogDescription>
                  View complete student information
                </DialogDescription>
              </DialogHeader>
              {selectedStudent && (
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p className="text-lg font-medium">{selectedStudent.profiles?.full_name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-lg font-medium">{selectedStudent.profiles?.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Student ID</Label>
                      <p className="text-lg font-medium">
                        <Badge variant="outline">{selectedStudent.student_id}</Badge>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Course</Label>
                      <p className="text-lg font-medium">{selectedStudent.course || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Year of Study</Label>
                      <p className="text-lg font-medium">{selectedStudent.year_of_study ? `${selectedStudent.year_of_study}${['st', 'nd', 'rd', 'th'][Math.min(selectedStudent.year_of_study - 1, 3)]} Year` : 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Room Assignment</Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.rooms ? `Room ${selectedStudent.rooms.room_number} (Floor ${selectedStudent.rooms.floor_number})` : 'No room assigned'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Guardian Name</Label>
                      <p className="text-lg font-medium">{selectedStudent.guardian_name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Guardian Phone</Label>
                      <p className="text-lg font-medium">{selectedStudent.guardian_phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-muted-foreground">Emergency Contact</Label>
                      <p className="text-lg font-medium">{selectedStudent.emergency_contact || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">Account Access</h4>
                          <p className="text-sm text-muted-foreground">
                            For security reasons, passwords cannot be retrieved. Generate a new password if needed.
                          </p>
                        </div>
                        <Button 
                          onClick={resetPassword} 
                          disabled={resettingPassword}
                          variant="outline"
                        >
                          {resettingPassword ? 'Generating...' : 'Generate New Password'}
                        </Button>
                      </div>
                      
                      {generatedPassword && (
                        <div className="bg-muted/50 p-4 rounded-lg border-2 border-primary/20">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Label className="text-sm font-semibold text-primary mb-2 block">New Password Generated</Label>
                              <div className="flex items-center gap-2">
                                <code className="text-lg font-mono bg-background px-3 py-2 rounded border flex-1 break-all">
                                  {generatedPassword}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedPassword);
                                    toast({
                                      title: "Copied!",
                                      description: "Password copied to clipboard",
                                    });
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                              <p className="text-xs text-destructive mt-2 font-medium">
                                ⚠️ Save this password securely - it cannot be retrieved later!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{student.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{student.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.student_id}</Badge>
                  </TableCell>
                  <TableCell>{student.course || 'N/A'}</TableCell>
                  <TableCell>{student.year_of_study || 'N/A'}</TableCell>
                  <TableCell>
                    {student.rooms ? (
                      <div>
                        <div className="font-medium">Room {student.rooms.room_number}</div>
                        <div className="text-sm text-muted-foreground">Floor {student.rooms.floor_number}</div>
                      </div>
                    ) : 'No room assigned'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteStudent(student)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(student)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentManagement;