import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

const EmailNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    recipients: 'all',
    priority: 'normal'
  });
  const { toast } = useToast();

  const templates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Fee Reminder',
      subject: 'Fee Payment Reminder - {hostel_name}',
      content: 'Dear {student_name},\n\nThis is a reminder that your hostel fee payment is due on {due_date}. Please make the payment at your earliest convenience.\n\nAmount: {amount}\nDue Date: {due_date}\n\nThank you.',
      category: 'fee'
    },
    {
      id: '2',
      name: 'Maintenance Notice',
      subject: 'Maintenance Schedule - {hostel_name}',
      content: 'Dear Students,\n\nWe would like to inform you about scheduled maintenance activities in {hostel_name} on {maintenance_date}.\n\nPlease plan accordingly and ensure your cooperation.\n\nThank you for your understanding.',
      category: 'maintenance'
    },
    {
      id: '3',
      name: 'Rule Violation',
      subject: 'Hostel Rule Violation Notice',
      content: 'Dear {student_name},\n\nThis is to inform you about a rule violation that has been recorded against you.\n\nViolation: {violation_type}\nDate: {violation_date}\nFine Amount: {fine_amount}\n\nPlease contact the warden for more details.',
      category: 'violation'
    }
  ];

  const handleSendEmail = async () => {
    if (!emailForm.subject || !emailForm.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Email Sent Successfully",
        description: `Email sent to ${emailForm.recipients} users`,
      });
      
      setEmailForm({
        subject: '',
        content: '',
        recipients: 'all',
        priority: 'normal'
      });
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEmailForm(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Email Notifications</h2>
          <p className="text-muted-foreground">Send notifications to students, wardens, or all users</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Email Compose Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Send custom email notifications to users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients</Label>
                <Select 
                  value={emailForm.recipients} 
                  onValueChange={(value) => setEmailForm(prev => ({ ...prev, recipients: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="wardens">Wardens Only</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={emailForm.priority} 
                  onValueChange={(value) => setEmailForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                value={emailForm.content}
                onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your message here..."
                rows={6}
              />
            </div>

            <Button 
              onClick={handleSendEmail} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Pre-defined templates for common notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.content.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Email Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent Today</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailNotifications;