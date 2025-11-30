import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Shield, Users, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HostelRule {
  id: string;
  title: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const HostelRulesManagement = () => {
  const [rules, setRules] = useState<HostelRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<HostelRule | null>(null);
  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    category: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('hostel_rules')
        .select('*')
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch hostel rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    try {
      // Get current warden's college and hostel info
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData, error: wardenError } = await supabase
        .from('wardens')
        .select('college_id, hostel_id')
        .eq('profile_id', user?.id)
        .single();

      if (wardenError || !wardenData) throw new Error('Unable to get warden information');

      const { error } = await supabase
        .from('hostel_rules')
        .insert({
          ...newRule,
          college_id: wardenData.college_id,
          hostel_id: wardenData.hostel_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hostel rule added successfully",
      });

      setIsAddDialogOpen(false);
      setNewRule({
        title: '',
        description: '',
        category: '',
        is_active: true
      });
      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add hostel rule",
        variant: "destructive",
      });
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<HostelRule>) => {
    try {
      const { error } = await supabase
        .from('hostel_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hostel rule updated successfully",
      });

      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update hostel rule",
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('hostel_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hostel rule deleted successfully",
      });

      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete hostel rule",
        variant: "destructive",
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    await updateRule(ruleId, { is_active: isActive });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Shield className="h-4 w-4" />;
      case 'discipline': return <AlertCircle className="h-4 w-4" />;
      case 'timings': return <Clock className="h-4 w-4" />;
      case 'visitors': return <Users className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'default';
      case 'discipline': return 'destructive';
      case 'timings': return 'secondary';
      case 'visitors': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading hostel rules...</div>
        </CardContent>
      </Card>
    );
  }

  const rulesByCategory = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, HostelRule[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Hostel Rules Management
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Hostel Rule</DialogTitle>
                  <DialogDescription>
                    Create a new rule for your hostel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Rule Title</Label>
                    <Input
                      id="title"
                      value={newRule.title}
                      onChange={(e) => setNewRule({...newRule, title: e.target.value})}
                      placeholder="e.g., No loud music after 10 PM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newRule.description}
                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                      placeholder="Detailed description of the rule"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newRule.category} onValueChange={(value) => setNewRule({...newRule, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="discipline">Discipline</SelectItem>
                        <SelectItem value="timings">Timings</SelectItem>
                        <SelectItem value="visitors">Visitors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newRule.is_active}
                      onCheckedChange={(checked) => setNewRule({...newRule, is_active: checked})}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addRule} disabled={!newRule.title || !newRule.category}>
                    Add Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Rules by Category */}
      <div className="space-y-6">
        {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getCategoryIcon(category)}
                <span className="capitalize">{category} Rules</span>
                <Badge variant={getCategoryColor(category)}>
                  {categoryRules.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="font-medium">{rule.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md truncate text-muted-foreground">
                            {rule.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                            />
                            <span className="text-sm">
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteRule(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              No hostel rules found. Click "Add Rule" to create your first rule.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HostelRulesManagement;