import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Fine {
  id: string;
  student_id: string;
  fine_reason: string;
  amount: number;
  due_date: string;
  status: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  student_name?: string;
  student_student_id?: string;
}

interface Student {
  id: string;
  student_id: string;
  profiles: {
    full_name: string;
  };
}

const FineManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFine, setEditingFine] = useState<Fine | null>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    fine_reason: '',
    amount: '',
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    try {
      // Get warden's hostel
      const { data: warden } = await supabase
        .from('wardens')
        .select('hostel_id, college_id')
        .eq('profile_id', profile?.id)
        .single();

      if (!warden) return;

      // Load students in warden's hostel
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          profiles:profile_id (
            full_name
          )
        `)
        .eq('hostel_id', warden.hostel_id);

      // Show all students, using student_id as fallback when profile is missing
      setStudents(studentsData || []);

      // Load fines for the hostel with student information
      const { data: finesData } = await supabase
        .from('fines')
        .select(`
          id,
          student_id,
          fine_reason,
          amount,
          due_date,
          status,
          payment_date,
          notes,
          created_at
        `)
        .eq('hostel_id', warden.hostel_id)
        .order('created_at', { ascending: false });

      // Manually join student data
      const finesWithStudents = await Promise.all((finesData || []).map(async (fine) => {
        const { data: studentData } = await supabase
          .from('students')
          .select(`
            student_id,
            profiles:profile_id (
              full_name
            )
          `)
          .eq('id', fine.student_id)
          .single();

        return {
          ...fine,
          student_name: studentData?.profiles?.full_name || 'Unknown Student',
          student_student_id: studentData?.student_id || 'Unknown'
        };
      }));

      setFines(finesWithStudents);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get warden's hostel and college info
      const { data: warden } = await supabase
        .from('wardens')
        .select('hostel_id, college_id')
        .eq('profile_id', profile?.id)
        .single();

      if (!warden) throw new Error('Warden not found');

      const fineData = {
        student_id: formData.student_id,
        college_id: warden.college_id,
        hostel_id: warden.hostel_id,
        fine_reason: formData.fine_reason,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes,
        created_by: profile?.id,
        status: 'pending'
      };

      if (editingFine) {
        const { error } = await supabase
          .from('fines')
          .update(fineData)
          .eq('id', editingFine.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Fine updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('fines')
          .insert(fineData);

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Fine created successfully"
        });
      }

      setFormData({
        student_id: '',
        fine_reason: '',
        amount: '',
        due_date: '',
        notes: ''
      });
      setIsCreateDialogOpen(false);
      setEditingFine(null);
      loadData();
    } catch (error) {
      console.error('Error saving fine:', error);
      toast({
        title: "Error",
        description: "Failed to save fine",
        variant: "destructive"
      });
    }
  };

  const markAsPaid = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('fines')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', fineId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fine marked as paid"
      });
      loadData();
    } catch (error) {
      console.error('Error updating fine:', error);
      toast({
        title: "Error",
        description: "Failed to update fine",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'paid') {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Paid</Badge>;
    }
    
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const openEditDialog = (fine: Fine) => {
    setEditingFine(fine);
    setFormData({
      student_id: fine.student_id,
      fine_reason: fine.fine_reason,
      amount: fine.amount.toString(),
      due_date: fine.due_date,
      notes: fine.notes || ''
    });
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      fine_reason: '',
      amount: '',
      due_date: '',
      notes: ''
    });
    setEditingFine(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fine Management</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fine
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingFine ? 'Edit Fine' : 'Create New Fine'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="student">Student</Label>
                    <Select 
                      value={formData.student_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                      disabled={!!editingFine}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.profiles?.full_name || `Student ${student.student_id}`} ({student.student_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fine_reason">Fine Reason</Label>
                    <Input
                      id="fine_reason"
                      value={formData.fine_reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, fine_reason: e.target.value }))}
                      placeholder="e.g., Late return to hostel"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the fine"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingFine ? 'Update Fine' : 'Create Fine'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No fines found
                  </TableCell>
                </TableRow>
              ) : (
                fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fine.student_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {fine.student_student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{fine.fine_reason}</TableCell>
                    <TableCell>₹{fine.amount}</TableCell>
                    <TableCell>{new Date(fine.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(fine.status, fine.due_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(fine)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {fine.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsPaid(fine.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FineManagement;