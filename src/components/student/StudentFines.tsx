import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Fine {
  id: string;
  fine_reason: string;
  amount: number;
  due_date: string;
  status: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
}

const StudentFines = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadFines();
    }
  }, [profile?.id]);

  const loadFines = async () => {
    try {
      // Get student record first
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!student) {
        setLoading(false);
        return;
      }

      // Load student's fines
      const { data: finesData } = await supabase
        .from('fines')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setFines(finesData || []);
    } catch (error) {
      console.error('Error loading fines:', error);
      toast({
        title: "Error",
        description: "Failed to load fines",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const handlePayFine = async (fineId: string) => {
    try {
      const fine = fines.find(f => f.id === fineId);
      if (!fine) {
        toast({
          title: "Error",
          description: "Fine not found",
          variant: "destructive"
        });
        return;
      }

      if (fine.status === 'paid') {
        toast({
          title: "Already Paid",
          description: "This fine has already been paid",
          variant: "default"
        });
        return;
      }

      // Create payment session for fine
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          fee_record_id: fineId,
          amount: fine.amount,
          description: `Fine Payment - ${fine.fine_reason}`
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        // Open Stripe Checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Please complete your payment in the new tab",
        });
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTotalPending = () => {
    return fines
      .filter(fine => fine.status === 'pending')
      .reduce((total, fine) => total + fine.amount, 0);
  };

  const getPendingCount = () => {
    return fines.filter(fine => fine.status === 'pending').length;
  };

  const getOverdueCount = () => {
    return fines.filter(fine => {
      const isOverdue = new Date(fine.due_date) < new Date() && fine.status === 'pending';
      return isOverdue;
    }).length;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getTotalPending()}</div>
            <p className="text-xs text-muted-foreground">
              {getPendingCount()} pending fines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Fines</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getOverdueCount()}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fines.length}</div>
            <p className="text-xs text-muted-foreground">
              All time fines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fines Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Fines</CardTitle>
        </CardHeader>
        <CardContent>
          {getOverdueCount() > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    You have {getOverdueCount()} overdue fine(s)
                  </h4>
                  <p className="text-sm text-red-600">
                    Please pay your overdue fines as soon as possible to avoid additional penalties.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No fines found. Keep up the good behavior! 🎉
                  </TableCell>
                </TableRow>
              ) : (
                fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fine.fine_reason}</div>
                        {fine.notes && (
                          <div className="text-sm text-muted-foreground">
                            {fine.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">₹{fine.amount}</TableCell>
                    <TableCell>
                      {new Date(fine.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(fine.status, fine.due_date)}
                    </TableCell>
                    <TableCell>
                      {fine.payment_date 
                        ? new Date(fine.payment_date).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {fine.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayFine(fine.id)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
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

export default StudentFines;