import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit, Search, DollarSign, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  student_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  hostels: {
    name: string;
  };
}

interface FeeRecord {
  id: string;
  student_id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_amount: number;
  status: string;
  created_at: string;
  students: {
    student_id: string;
    profiles: {
      full_name: string;
    };
  };
}

interface FeeForm {
  student_id: string;
  fee_type: string;
  amount: number;
  due_date: Date;
  notes: string;
}

const FeeManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();

  const [feeForm, setFeeForm] = useState<FeeForm>({
    student_id: '',
    fee_type: 'tuition',
    amount: 0,
    due_date: new Date(),
    notes: ''
  });

  const [bulkFeeForm, setBulkFeeForm] = useState({
    fee_type: 'tuition',
    amount: 0,
    due_date: new Date(),
    notes: '',
    hostel_filter: 'all'
  });

  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalOutstanding: 0,
    totalCollected: 0,
    overdueCount: 0
  });

  // Mess fee generation state
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState<number>(new Date().getFullYear());
  const [genRate, setGenRate] = useState<number>(0);
  const [genDueDate, setGenDueDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [feeRecords, searchTerm, statusFilter, feeTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          profiles!inner(full_name, email),
          hostels!inner(name)
        `);

      if (studentsError) throw studentsError;

      // Fetch fee records
      const { data: feeData, error: feeError } = await supabase
        .from('fee_records')
        .select(`
          id,
          student_id,
          fee_type,
          amount,
          due_date,
          paid_amount,
          status,
          created_at,
          students!inner(
            student_id,
            profiles!inner(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (feeError) throw feeError;

      setStudents(studentsData || []);
      setFeeRecords(feeData || []);
      
      // Calculate statistics
      calculateStatistics(feeData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fee data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (records: FeeRecord[]) => {
    const stats = {
      totalStudents: students.length,
      totalOutstanding: 0,
      totalCollected: 0,
      overdueCount: 0
    };

    records.forEach(record => {
      const outstanding = record.amount - (record.paid_amount || 0);
      stats.totalOutstanding += outstanding;
      stats.totalCollected += record.paid_amount || 0;
      
      if (record.status === 'pending' && new Date(record.due_date) < new Date()) {
        stats.overdueCount++;
      }
    });

    setStatistics(stats);
  };

  const filterRecords = () => {
    let filtered = feeRecords;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.students.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.students.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.fee_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    if (feeTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.fee_type === feeTypeFilter);
    }

    setFilteredRecords(filtered);
  };

  const handleCreateFee = async () => {
    try {
      const student = students.find(s => s.id === feeForm.student_id);
      if (!student) throw new Error('Student not found');

      const { error } = await supabase
        .from('fee_records')
        .insert({
          student_id: feeForm.student_id,
          college_id: (await supabase.from('students').select('college_id').eq('id', feeForm.student_id).single()).data?.college_id,
          hostel_id: (await supabase.from('students').select('hostel_id').eq('id', feeForm.student_id).single()).data?.hostel_id,
          fee_type: feeForm.fee_type,
          amount: feeForm.amount,
          due_date: format(feeForm.due_date, 'yyyy-MM-dd'),
          notes: feeForm.notes,
          status: 'pending',
          paid_amount: 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee record created successfully"
      });

      setIsCreateDialogOpen(false);
      resetFeeForm();
      fetchData();
    } catch (error) {
      console.error('Error creating fee:', error);
      toast({
        title: "Error",
        description: "Failed to create fee record",
        variant: "destructive"
      });
    }
  };

  const handleBulkCreateFees = async () => {
    try {
      let targetStudents = students;

      if (bulkFeeForm.hostel_filter !== 'all') {
        targetStudents = students.filter(s => s.hostels.name === bulkFeeForm.hostel_filter);
      }

      const feeRecords = [];
      for (const student of targetStudents) {
        const studentDetails = await supabase
          .from('students')
          .select('college_id, hostel_id')
          .eq('id', student.id)
          .single();

        feeRecords.push({
          student_id: student.id,
          college_id: studentDetails.data?.college_id,
          hostel_id: studentDetails.data?.hostel_id,
          fee_type: bulkFeeForm.fee_type,
          amount: bulkFeeForm.amount,
          due_date: format(bulkFeeForm.due_date, 'yyyy-MM-dd'),
          notes: bulkFeeForm.notes,
          status: 'pending',
          paid_amount: 0
        });
      }

      const { error } = await supabase
        .from('fee_records')
        .insert(feeRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Created ${feeRecords.length} fee records successfully`
      });

      setIsBulkDialogOpen(false);
      resetBulkForm();
      fetchData();
    } catch (error) {
      console.error('Error creating bulk fees:', error);
      toast({
        title: "Error",
        description: "Failed to create bulk fee records",
        variant: "destructive"
      });
    }
  };

  const handleGenerateMessFees = async () => {
    try {
      setIsGenerating(true);
      const startDate = new Date(genYear, genMonth - 1, 1);
      const endDate = new Date(genYear, genMonth, 0);
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');

      const { data: attendance, error: attErr } = await supabase
        .from('attendance')
        .select('student_id, date, status, mess_attendance, attendance_type')
        .eq('attendance_type', 'mess')
        .gte('date', from)
        .lte('date', to);
      if (attErr) throw attErr;

      const dayMap = new Map<string, Set<string>>();
      (attendance || []).forEach((a: any) => {
        const isPresent = a.status === 'present' || a.mess_attendance === true;
        if (!isPresent) return;
        const sid = a.student_id as string;
        const d = a.date as string;
        if (!dayMap.has(sid)) dayMap.set(sid, new Set());
        dayMap.get(sid)!.add(d);
      });

      const entries = Array.from(dayMap.entries()).map(([student_id, dates]) => ({ student_id, days: (dates as Set<string>).size }));
      if (entries.length === 0) {
        toast({ title: 'No attendance', description: 'No mess attendance found for the selected month' });
        return;
      }

      const studentIds = entries.map(e => e.student_id);
      const { data: studs, error: studsErr } = await supabase
        .from('students')
        .select('id, college_id, hostel_id')
        .in('id', studentIds);
      if (studsErr) throw studsErr;

      const details = new Map<string, { college_id: string | null; hostel_id: string | null }>();
      (studs || []).forEach((s: any) => details.set(s.id, { college_id: s.college_id, hostel_id: s.hostel_id }));

      const records = entries.map((e) => ({
        student_id: e.student_id,
        college_id: details.get(e.student_id)?.college_id,
        hostel_id: details.get(e.student_id)?.hostel_id,
        fee_type: 'mess',
        amount: e.days * genRate,
        due_date: format(genDueDate, 'yyyy-MM-dd'),
        notes: `Mess fee for ${genMonth}/${genYear} - ${e.days} days`,
        status: 'pending',
        paid_amount: 0,
      }));

      const { error: insErr } = await supabase.from('fee_records').insert(records);
      if (insErr) throw insErr;

      toast({ title: 'Mess fees generated', description: `Created ${records.length} records` });
      setIsGenerateDialogOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Generate mess fees error:', e);
      toast({ title: 'Failed to generate', description: e.message || 'Error creating mess fee records', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetFeeForm = () => {
    setFeeForm({
      student_id: '',
      fee_type: 'tuition',
      amount: 0,
      due_date: new Date(),
      notes: ''
    });
  };

  const resetBulkForm = () => {
    setBulkFeeForm({
      fee_type: 'tuition',
      amount: 0,
      due_date: new Date(),
      notes: '',
      hostel_filter: 'all'
    });
  };

  const handleMarkAsPaid = async (feeRecordId: string, totalAmount: number) => {
    try {
      const { error } = await supabase
        .from('fee_records')
        .update({
          paid_amount: totalAmount,
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: 'admin_marked'
        })
        .eq('id', feeRecordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee marked as paid successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error marking fee as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark fee as paid",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = status === 'pending' && new Date(dueDate) < new Date();
    
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'partial':
        return <Badge variant="outline">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-6">Loading fee management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{statistics.totalOutstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{statistics.totalCollected.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Records</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Fee Management</CardTitle>
              <CardDescription>Manage student fees and payment records</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Generate Mess Fees
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generate Mess Fees (Auto)</DialogTitle>
                    <DialogDescription>Create mess fees based on attended days</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Month</Label>
                        <Select value={String(genMonth)} onValueChange={(v) => setGenMonth(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                              <SelectItem key={m} value={String(m)}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Input type="number" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label>Rate per day (₹)</Label>
                      <Input type="number" value={genRate} onChange={(e) => setGenRate(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(genDueDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={genDueDate}
                            onSelect={(date) => date && setGenDueDate(date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button onClick={handleGenerateMessFees} disabled={isGenerating || genRate <= 0}>
                      {isGenerating ? 'Generating...' : 'Generate Fees'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Fee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Fee Record</DialogTitle>
                    <DialogDescription>Add a new fee record for a student</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="student">Student</Label>
                      <Select value={feeForm.student_id} onValueChange={(value) => setFeeForm({...feeForm, student_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.profiles.full_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fee_type">Fee Type</Label>
                      <Select value={feeForm.fee_type} onValueChange={(value) => setFeeForm({...feeForm, fee_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuition">Tuition Fee</SelectItem>
                          <SelectItem value="hostel">Hostel Fee</SelectItem>
                          <SelectItem value="mess">Mess Fee</SelectItem>
                          <SelectItem value="library">Library Fee</SelectItem>
                          <SelectItem value="exam">Exam Fee</SelectItem>
                          <SelectItem value="fine">Fine</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        type="number"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({...feeForm, amount: Number(e.target.value)})}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !feeForm.due_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(feeForm.due_date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={feeForm.due_date}
                            onSelect={(date) => date && setFeeForm({...feeForm, due_date: date})}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        value={feeForm.notes}
                        onChange={(e) => setFeeForm({...feeForm, notes: e.target.value})}
                        placeholder="Optional notes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateFee} className="flex-1">Create Fee</Button>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Create
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Bulk Create Fee Records</DialogTitle>
                    <DialogDescription>Create fee records for multiple students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="hostel_filter">Target Students</Label>
                      <Select value={bulkFeeForm.hostel_filter} onValueChange={(value) => setBulkFeeForm({...bulkFeeForm, hostel_filter: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          {[...new Set(students.map(s => s.hostels.name))].map((hostel) => (
                            <SelectItem key={hostel} value={hostel}>{hostel} Students</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bulk_fee_type">Fee Type</Label>
                      <Select value={bulkFeeForm.fee_type} onValueChange={(value) => setBulkFeeForm({...bulkFeeForm, fee_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuition">Tuition Fee</SelectItem>
                          <SelectItem value="hostel">Hostel Fee</SelectItem>
                          <SelectItem value="mess">Mess Fee</SelectItem>
                          <SelectItem value="library">Library Fee</SelectItem>
                          <SelectItem value="exam">Exam Fee</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bulk_amount">Amount (₹)</Label>
                      <Input
                        type="number"
                        value={bulkFeeForm.amount}
                        onChange={(e) => setBulkFeeForm({...bulkFeeForm, amount: Number(e.target.value)})}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !bulkFeeForm.due_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(bulkFeeForm.due_date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={bulkFeeForm.due_date}
                            onSelect={(date) => date && setBulkFeeForm({...bulkFeeForm, due_date: date})}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="bulk_notes">Notes</Label>
                      <Textarea
                        value={bulkFeeForm.notes}
                        onChange={(e) => setBulkFeeForm({...bulkFeeForm, notes: e.target.value})}
                        placeholder="Optional notes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleBulkCreateFees} className="flex-1">Create Fees</Button>
                      <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tuition">Tuition</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="mess">Mess</SelectItem>
                <SelectItem value="library">Library</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="fine">Fine</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No fee records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.students.profiles.full_name}</div>
                          <div className="text-sm text-muted-foreground">{record.students.student_id}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{record.fee_type}</TableCell>
                      <TableCell>₹{record.amount.toLocaleString()}</TableCell>
                      <TableCell>₹{(record.paid_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(record.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(record.status, record.due_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {record.status !== 'paid' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkAsPaid(record.id, record.amount)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeManagement;