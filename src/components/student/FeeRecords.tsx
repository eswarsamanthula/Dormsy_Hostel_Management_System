import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeeRecordsProps {
  student: any;
}

const FeeRecords = ({ student }: FeeRecordsProps) => {
  const { toast } = useToast();
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeRecords();
  }, [student]);

  const fetchFeeRecords = async () => {
    if (!student?.id) return;

    try {
      const { data, error } = await supabase
        .from('fee_records')
        .select('*')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setFeeRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching fee records:', error);
      toast({
        title: "Error",
        description: "Failed to load fee records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      case 'partial':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CreditCard className="h-4 w-4" />;
      case 'pending':
        return <Calendar className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'partial':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  const getTotalOutstanding = () => {
    return feeRecords
      .filter(record => record.status !== 'paid')
      .reduce((total, record) => total + (record.amount - (record.paid_amount || 0)), 0);
  };

  const getTotalPaid = () => {
    return feeRecords.reduce((total, record) => total + (record.paid_amount || 0), 0);
  };

  const handleMakePayment = async (record: any) => {
    try {
      const remaining = Number(record.amount || 0) - Number(record.paid_amount || 0);
      if (remaining <= 0) {
        toast({ title: "No Outstanding", description: "This fee is already paid.", variant: "default" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { fee_record_id: record.id },
      });

      if (error) throw error as any;
      if (data?.url) {
        // Open Stripe Checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({ title: 'Payment Error', description: err.message || 'Could not start payment.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading fee records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Fee Records</h2>
        <p className="text-muted-foreground">Track your payments and outstanding dues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {formatCurrency(getTotalOutstanding())}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalPaid())}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{feeRecords.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Records List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment History</h3>
        {feeRecords.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No fee records found</p>
            </CardContent>
          </Card>
        ) : (
          feeRecords.map((record) => (
            <Card key={record.id} className={isOverdue(record.due_date, record.status) ? 'border-red-200 bg-red-50/50' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {record.fee_type.charAt(0).toUpperCase() + record.fee_type.slice(1)} Fee
                    {isOverdue(record.due_date, record.status) && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(record.status)}`}>
                    {getStatusIcon(record.status)}
                    {record.status}
                  </Badge>
                </div>
                <CardDescription>
                  Due Date: {new Date(record.due_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(record.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(record.paid_amount || 0)}
                    </p>
                  </div>
                </div>

                {record.amount > (record.paid_amount || 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-800">Outstanding Balance</p>
                    </div>
                    <p className="text-lg font-bold text-yellow-900">
                      {formatCurrency(record.amount - (record.paid_amount || 0))}
                    </p>
                  </div>
                )}

                {record.paid_date && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Paid on: {new Date(record.paid_date).toLocaleDateString()}
                    {record.payment_method && ` via ${record.payment_method}`}
                  </div>
                )}

                {record.notes && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm text-muted-foreground">{record.notes}</p>
                  </div>
                )}

                {record.status !== 'paid' && (
                  <div className="mt-4">
                    <Button className="w-full md:w-auto" onClick={() => handleMakePayment(record)}>
                      Make Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeeRecords;