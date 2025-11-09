import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequestFormProps {
  student: any;
}

const LeaveRequestForm = ({ student }: LeaveRequestFormProps) => {
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'short',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const leaveTypes = [
    { value: 'short', label: 'Short Leave (1-3 days)' },
    { value: 'long', label: 'Long Leave (4+ days)' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'medical', label: 'Medical Leave' },
    { value: 'personal', label: 'Personal Leave' }
  ];

  useEffect(() => {
    fetchLeaveRequests();
  }, [student]);

  const fetchLeaveRequests = async () => {
    if (!student?.id) return;

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
      toast({
        title: "Error",
        description: "Failed to load leave requests",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate >= endDate) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert([{
          student_id: student.id,
          college_id: student.college_id,
          hostel_id: student.hostel_id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          status: 'pending'
        }]);

      if (error) throw error;

      // Send notification to wardens
      try {
        await supabase.functions.invoke('notify-on-action', {
          body: {
            action: 'leave_created',
            student_id: student.id,
            data: {
              leave_type: formData.leave_type,
              start_date: formData.start_date,
              end_date: formData.end_date
            }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      toast({
        title: "Success",
        description: "Your leave request has been submitted successfully"
      });

      setFormData({ leave_type: 'short', start_date: '', end_date: '', reason: '' });
      setShowForm(false);
      fetchLeaveRequests();
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leave Requests</h2>
          <p className="text-muted-foreground">Apply for leave and track your requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Leave Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Apply for Leave</CardTitle>
            <CardDescription>
              Please provide details about your leave request. Make sure to apply well in advance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="leave_type">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium">
                    Duration: {calculateDays(formData.start_date, formData.end_date)} day(s)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reason for Leave</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a detailed reason for your leave request..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Leave Requests</h3>
        {leaveRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No leave requests submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          leaveRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {leaveTypes.find(t => t.value === request.leave_type)?.label || request.leave_type}
                  </CardTitle>
                  <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()} 
                  ({calculateDays(request.start_date, request.end_date)} days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Reason:</p>
                  <p className="text-muted-foreground">{request.reason}</p>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Applied on: {new Date(request.created_at).toLocaleDateString()}
                </div>

                {request.admin_notes && (
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium mb-2">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                    {request.approved_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Approved on: {new Date(request.approved_at).toLocaleDateString()}
                      </p>
                    )}
                    {request.rejected_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Rejected on: {new Date(request.rejected_at).toLocaleDateString()}
                      </p>
                    )}
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

export default LeaveRequestForm;