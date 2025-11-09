import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LeaveRequest {
  id: string;
  reason: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
  admin_notes: string;
  created_at: string;
  approved_at: string;
  rejected_at: string;
  students: {
    student_id: string;
    profiles: {
      full_name: string;
    };
    rooms: {
      room_number: string;
    };
  };
}

const LeaveApprovals = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          students:student_id (
            student_id,
            profiles:profile_id (
              full_name
            ),
            rooms:room_id (
              room_number
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch leave requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      const updateData: any = {
        status,
        admin_notes: adminNotes,
      };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else {
        updateData.rejected_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', leaveId);

      if (error) throw error;

      // Send notification to student
      try {
        await supabase.functions.invoke('notify-on-action', {
          body: {
            action: status === 'approved' ? 'leave_approved' : 'leave_rejected',
            student_id: leaveId,
            data: {
              leave_type: selectedLeave?.leave_type,
              start_date: selectedLeave?.start_date,
              end_date: selectedLeave?.end_date
            }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      toast({
        title: "Success",
        description: `Leave request ${status} successfully`,
      });

      setSelectedLeave(null);
      setAdminNotes('');
      fetchLeaveRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update leave request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'short': return 'default';
      case 'long': return 'secondary';
      case 'emergency': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading leave requests...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Request Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {leave.students?.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Room {leave.students?.rooms?.room_number || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLeaveTypeColor(leave.leave_type)}>
                        {leave.leave_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(leave.start_date), 'MMM dd')}</div>
                        <div className="text-muted-foreground">
                          to {format(new Date(leave.end_date), 'MMM dd')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{leave.reason}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(leave.status)}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setAdminNotes(leave.admin_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Leave Request Details</DialogTitle>
                          </DialogHeader>
                          {selectedLeave && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Student</h4>
                                  <p>{selectedLeave.students?.profiles?.full_name}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Room</h4>
                                  <p>Room {selectedLeave.students?.rooms?.room_number}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Leave Type</h4>
                                  <Badge variant={getLeaveTypeColor(selectedLeave.leave_type)}>
                                    {selectedLeave.leave_type}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="font-medium">Status</h4>
                                  <Badge variant={getStatusColor(selectedLeave.status)}>
                                    {selectedLeave.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Start Date</h4>
                                  <p>{format(new Date(selectedLeave.start_date), 'PPP')}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">End Date</h4>
                                  <p>{format(new Date(selectedLeave.end_date), 'PPP')}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Reason</h4>
                                <p>{selectedLeave.reason}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Admin Notes</h4>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add admin notes..."
                                  rows={3}
                                />
                              </div>
                              {selectedLeave.status === 'pending' && (
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => updateLeaveStatus(selectedLeave.id, 'rejected')}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => updateLeaveStatus(selectedLeave.id, 'approved')}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {leaveRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveApprovals;