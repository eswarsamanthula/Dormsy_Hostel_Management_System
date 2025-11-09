import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Eye, QrCode, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCodeGenerator from "qrcode";

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
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  qr_code: string | null;
  created_at: string;
  approved_at: string | null;
}

interface VisitorManagementProps {
  studentId: string;
  studentData: any;
}

export default function VisitorManagement({ studentId, studentData }: VisitorManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRequest | null>(null);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    visitor_id_proof: '',
    relationship: '',
    visit_purpose: '',
    visit_date: '',
    visit_time_from: '',
    visit_time_to: '',
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      console.log('Fetching visitors for student ID:', studentId);
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Visitors data received:', data);
      // Type cast with proper status handling
      const visitorsData = (data || []).map(visitor => ({
        ...visitor,
        status: visitor.status as 'pending' | 'approved' | 'rejected' | 'completed'
      }));
      setVisitors(visitorsData);
    } catch (error: any) {
      console.error('Failed to fetch visitors:', error);
      toast({
        title: "Error",
        description: `Failed to fetch visitor requests: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('visitors')
        .insert({
          student_id: studentId,
          visitor_name: formData.visitor_name,
          visitor_phone: formData.visitor_phone,
          visitor_id_proof: formData.visitor_id_proof,
          relationship: formData.relationship,
          visit_purpose: formData.visit_purpose,
          visit_date: formData.visit_date,
          visit_time_from: formData.visit_time_from,
          visit_time_to: formData.visit_time_to,
          college_id: studentData.college_id,
          hostel_id: studentData.hostel_id,
        });

      if (error) throw error;

      // Send notification to wardens
      try {
        await supabase.functions.invoke('notify-on-action', {
          body: {
            action: 'visitor_created',
            student_id: studentId,
            data: {
              visitor_name: formData.visitor_name,
              visit_date: formData.visit_date
            }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }

      toast({
        title: "Success",
        description: "Visitor request submitted successfully",
      });

      setFormData({
        visitor_name: '',
        visitor_phone: '',
        visitor_id_proof: '',
        relationship: '',
        visit_purpose: '',
        visit_date: '',
        visit_time_from: '',
        visit_time_to: '',
      });
      
      setIsDialogOpen(false);
      fetchVisitors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit visitor request",
        variant: "destructive",
      });
    }
  };

  const generateVisitorQR = async (visitor: VisitorRequest) => {
    if (!visitor.qr_code && visitor.status === 'approved') {
      // Generate QR code data for approved visitor
      const qrData = {
        type: 'visitor_pass',
        visitor_id: visitor.id,
        visitor_name: visitor.visitor_name,
        student_id: studentId,
        visit_date: visitor.visit_date,
        time_slot: `${visitor.visit_time_from} - ${visitor.visit_time_to}`,
        approved_at: visitor.approved_at,
      };

      try {
        // Create QR code entry
        const { error: qrError } = await supabase
          .from('qr_codes')
          .insert({
            user_id: profile?.id,
            code_type: 'visitor_pass',
            code_data: JSON.stringify(qrData),
            expires_at: new Date(visitor.visit_date + ' 23:59:59').toISOString(),
            college_id: studentData.college_id,
            hostel_id: studentData.hostel_id,
          });

        if (qrError) throw qrError;

        // Update visitor with QR code
        const { error: updateError } = await supabase
          .from('visitors')
          .update({ qr_code: JSON.stringify(qrData) })
          .eq('id', visitor.id);

        if (updateError) throw updateError;
        
        fetchVisitors();
      } catch (error: any) {
        console.error('Failed to generate QR code:', error);
      }
    }

    // Generate QR code image
    if (visitor.qr_code) {
      try {
        const qrDataURL = await QRCodeGenerator.toDataURL(visitor.qr_code, {
          width: 300,
          margin: 2,
        });
        setQrCodeImage(qrDataURL);
        setSelectedVisitor(visitor);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to generate QR code image",
          variant: "destructive",
        });
      }
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
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Visitor Management
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Request Visitor Pass
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>New Visitor Request</DialogTitle>
                  <DialogDescription>
                    Fill in the details to request a visitor pass. The request will be reviewed by the warden.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="visitor_name">Visitor Name *</Label>
                      <Input
                        id="visitor_name"
                        value={formData.visitor_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, visitor_name: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="visitor_phone">Visitor Phone *</Label>
                      <Input
                        id="visitor_phone"
                        value={formData.visitor_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, visitor_phone: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="visitor_id_proof">ID Proof Number *</Label>
                      <Input
                        id="visitor_id_proof"
                        placeholder="Aadhar/License/Passport"
                        value={formData.visitor_id_proof}
                        onChange={(e) => setFormData(prev => ({ ...prev, visitor_id_proof: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="relationship">Relationship *</Label>
                      <Select 
                        value={formData.relationship} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="relative">Relative</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="visit_date">Visit Date *</Label>
                      <Input
                        id="visit_date"
                        type="date"
                        value={formData.visit_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2 grid-cols-2">
                      <div>
                        <Label htmlFor="visit_time_from">From *</Label>
                        <Input
                          id="visit_time_from"
                          type="time"
                          value={formData.visit_time_from}
                          onChange={(e) => setFormData(prev => ({ ...prev, visit_time_from: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="visit_time_to">To *</Label>
                        <Input
                          id="visit_time_to"
                          type="time"
                          value={formData.visit_time_to}
                          onChange={(e) => setFormData(prev => ({ ...prev, visit_time_to: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="visit_purpose">Purpose of Visit</Label>
                    <Textarea
                      id="visit_purpose"
                      placeholder="Briefly describe the purpose of visit"
                      value={formData.visit_purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, visit_purpose: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Request visitor passes and track their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading visitor requests...</p>
          ) : visitors.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No visitor requests yet. Click above to request your first visitor pass.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Time</TableHead>
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
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{visitor.relationship}</TableCell>
                    <TableCell>{new Date(visitor.visit_date).toLocaleDateString()}</TableCell>
                    <TableCell>{visitor.visit_time_from} - {visitor.visit_time_to}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(visitor.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(visitor.status)}
                        <span className="capitalize">{visitor.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {visitor.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateVisitorQR(visitor)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeImage} onOpenChange={() => { setQrCodeImage(null); setSelectedVisitor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visitor Pass QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code to the security guard for entry
            </DialogDescription>
          </DialogHeader>
          
          {qrCodeImage && selectedVisitor && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCodeImage} alt="Visitor QR Code" className="border rounded-lg" />
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="font-medium">{selectedVisitor.visitor_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Visit Date: {new Date(selectedVisitor.visit_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Time: {selectedVisitor.visit_time_from} - {selectedVisitor.visit_time_to}
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `visitor-pass-${selectedVisitor.visitor_name}-${selectedVisitor.visit_date}.png`;
                  link.href = qrCodeImage;
                  link.click();
                }}
              >
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}