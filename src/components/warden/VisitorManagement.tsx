import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, Clock, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VisitorRequest {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_id_proof: string;
  relationship: string;
  visit_purpose: string;
  visit_date: string;
  visit_time_from: string;
  visit_time_to: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  student_name?: string;
  student_roll?: string;
}

const WardenVisitorManagement = () => {
  const { profile } = useAuth();
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVisitors = async () => {
    try {
      if (!profile?.id) return;

      // Get warden's hostel_id first
      const { data: warden, error: wardenError } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (wardenError) throw wardenError;
      if (!warden?.hostel_id) return;

      const { data, error } = await supabase
        .from('visitors')
        .select(`
          *,
          students!inner(
            student_id,
            profiles!inner(
              full_name
            )
          )
        `)
        .eq('hostel_id', warden.hostel_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: VisitorRequest[] = (data || []).map((visitor: any) => ({
        ...visitor,
        student_name: visitor.students?.profiles?.full_name || 'Unknown',
        student_roll: visitor.students?.student_id || 'Unknown'
      }));
      
      setVisitors(transformedData);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to fetch visitor requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [profile?.id]);

  const handleApproval = async (visitorId: string, action: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const updateData: any = {
        status: action,
        approved_by: profile?.id,
        approved_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('visitors')
        .update(updateData)
        .eq('id', visitorId);

      if (error) throw error;

      // Send notification to student if approved
      if (action === 'approved') {
        // Get visitor with student ID from database since it's not in the interface
        const { data: visitorData } = await supabase
          .from('visitors')
          .select('student_id, visitor_name, visit_date')
          .eq('id', visitorId)
          .single();

        if (visitorData) {
          try {
            await supabase.functions.invoke('notify-on-action', {
              body: {
                action: 'visitor_approved',
                student_id: visitorData.student_id,
                data: {
                  visitor_name: visitorData.visitor_name,
                  visit_date: visitorData.visit_date
                }
              }
            });
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
          }
        }
      }

      toast.success(`Visitor request ${action} successfully`);
      fetchVisitors();
      setSelectedVisitor(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating visitor:', error);
      toast.error(`Failed to ${action.slice(0, -1)} visitor request`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading visitor requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Visitor Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage visitor requests for your hostel
          </p>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No visitor requests</h3>
              <p className="text-muted-foreground">No visitor requests have been submitted yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor Details</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Visit Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{visitor.visitor_name}</div>
                        <div className="text-sm text-muted-foreground">{visitor.visitor_phone}</div>
                        <div className="text-xs text-muted-foreground">{visitor.relationship}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{visitor.student_name}</div>
                      <div className="text-sm text-muted-foreground">{visitor.student_roll}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{format(new Date(visitor.visit_date), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">
                          {visitor.visit_time_from} - {visitor.visit_time_to}
                        </div>
                        <div className="text-xs text-muted-foreground">{visitor.visit_purpose}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(visitor.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(visitor.status)}
                        {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVisitor(visitor)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Visitor Request Details</DialogTitle>
                              <DialogDescription>
                                Review and manage visitor request
                              </DialogDescription>
                            </DialogHeader>
                            {selectedVisitor && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Visitor Name</Label>
                                    <p className="text-sm">{selectedVisitor.visitor_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Phone</Label>
                                    <p className="text-sm">{selectedVisitor.visitor_phone}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">ID Proof</Label>
                                    <p className="text-sm">{selectedVisitor.visitor_id_proof}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Relationship</Label>
                                    <p className="text-sm">{selectedVisitor.relationship}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Student</Label>
                                    <p className="text-sm">{selectedVisitor.student_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Visit Date</Label>
                                    <p className="text-sm">{format(new Date(selectedVisitor.visit_date), 'MMM dd, yyyy')}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Visit Time</Label>
                                    <p className="text-sm">{selectedVisitor.visit_time_from} - {selectedVisitor.visit_time_to}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Badge variant={getStatusColor(selectedVisitor.status)} className="w-fit">
                                      {selectedVisitor.status.charAt(0).toUpperCase() + selectedVisitor.status.slice(1)}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Purpose</Label>
                                  <p className="text-sm">{selectedVisitor.visit_purpose}</p>
                                </div>
                                
                                {selectedVisitor.status === 'pending' && (
                                  <div className="flex items-center gap-2 pt-4">
                                    <Button
                                      onClick={() => handleApproval(selectedVisitor.id, 'approved')}
                                      disabled={actionLoading}
                                      className="flex-1"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleApproval(selectedVisitor.id, 'rejected')}
                                      disabled={actionLoading}
                                      className="flex-1"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {visitor.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(visitor.id, 'approved')}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproval(visitor.id, 'rejected')}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WardenVisitorManagement;