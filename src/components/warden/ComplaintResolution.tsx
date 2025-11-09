import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Check, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution_notes: string;
  created_at: string;
  resolved_at: string;
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

const ComplaintResolution = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
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
      setComplaints(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: string, status: string, notes?: string) => {
    try {
      const updateData: any = {
        status,
        resolution_notes: notes || resolutionNotes,
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);

      if (error) throw error;

      // Send notification to student if resolved
      if (status === 'resolved') {
        try {
          await supabase.functions.invoke('notify-on-action', {
            body: {
              action: 'complaint_resolved',
              student_id: complaintId,
              data: {
                title: selectedComplaint?.title || 'Your complaint'
              }
            }
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      toast({
        title: "Success",
        description: `Complaint ${status} successfully`,
      });

      setSelectedComplaint(null);
      setResolutionNotes('');
      fetchComplaints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update complaint",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading complaints...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingComplaints = complaints.filter(c => c.status === 'pending');
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingComplaints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressComplaints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolvedComplaints.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Resolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {complaint.students?.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Room {complaint.students?.rooms?.room_number || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{complaint.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {complaint.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{complaint.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(complaint.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setResolutionNotes(complaint.resolution_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Complaint Details</DialogTitle>
                          </DialogHeader>
                          {selectedComplaint && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Title</h4>
                                <p>{selectedComplaint.title}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Description</h4>
                                <p>{selectedComplaint.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Category</h4>
                                  <Badge variant="outline">{selectedComplaint.category}</Badge>
                                </div>
                                <div>
                                  <h4 className="font-medium">Priority</h4>
                                  <Badge variant={getPriorityColor(selectedComplaint.priority)}>
                                    {selectedComplaint.priority}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Resolution Notes</h4>
                                <Textarea
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  placeholder="Add resolution notes..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                {selectedComplaint.status === 'pending' && (
                                  <Button
                                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'in_progress')}
                                  >
                                    Start Working
                                  </Button>
                                )}
                                {(selectedComplaint.status === 'pending' || selectedComplaint.status === 'in_progress') && (
                                  <Button
                                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved')}
                                  >
                                    Mark as Resolved
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {complaints.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No complaints found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintResolution;