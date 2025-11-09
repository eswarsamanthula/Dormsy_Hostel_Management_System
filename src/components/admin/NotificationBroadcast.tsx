import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Send, Users, AlertCircle } from "lucide-react";

interface BroadcastForm {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'complaint' | 'leave' | 'fee' | 'visitor' | 'attendance' | 'system';
  targetRoles: string[];
  expires_at: string;
}

export default function NotificationBroadcast() {
  const { toast } = useToast();
  const [form, setForm] = useState<BroadcastForm>({
    title: '',
    message: '',
    type: 'info',
    category: 'system',
    targetRoles: [],
    expires_at: ''
  });

  const [sending, setSending] = useState(false);

  const handleRoleToggle = (role: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      targetRoles: checked 
        ? [...prev.targetRoles, role]
        : prev.targetRoles.filter(r => r !== role)
    }));
  };

  const sendBroadcastNotification = async () => {
    if (!form.title.trim() || !form.message.trim() || form.targetRoles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, message, and select at least one target role.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
          category: form.category,
          targetRoles: form.targetRoles,
          expires_at: form.expires_at || null
        }
      });

      if (error) throw error;

      toast({
        title: "Broadcast Sent",
        description: `Notification sent to all ${form.targetRoles.join(', ')} users.`,
      });

      // Reset form
      setForm({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        targetRoles: [],
        expires_at: ''
      });

    } catch (error: any) {
      console.error('Failed to send broadcast notification:', error);
      toast({
        title: "Failed to Send",
        description: error.message || "There was an error sending the notification.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Broadcast Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium text-sm mb-2">Preview</h4>
            <div className={`p-3 rounded border ${getTypeColor(form.type)}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">📢</span>
                <div className="flex-1">
                  <h5 className="font-medium">
                    {form.title || "Notification Title"}
                  </h5>
                  <p className="text-sm mt-1">
                    {form.message || "Your notification message will appear here..."}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {form.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message here..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.message.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(value: any) => setForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(value: any) => setForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Target Roles</Label>
              <div className="flex items-center space-x-6 mt-2">
                {[
                  { value: 'admin', label: 'Admins' },
                  { value: 'warden', label: 'Wardens' },
                  { value: 'student', label: 'Students' }
                ].map(role => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.value}
                      checked={form.targetRoles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleToggle(role.value, checked as boolean)}
                    />
                    <Label htmlFor={role.value} className="cursor-pointer">{role.label}</Label>
                  </div>
                ))}
              </div>
              {form.targetRoles.length === 0 && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please select at least one target role
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for notifications that don't expire
              </p>
            </div>

            <Button 
              onClick={sendBroadcastNotification}
              disabled={sending || !form.title.trim() || !form.message.trim() || form.targetRoles.length === 0}
              className="w-full"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Broadcast to {form.targetRoles.length > 0 ? form.targetRoles.join(', ') : 'Selected Roles'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}