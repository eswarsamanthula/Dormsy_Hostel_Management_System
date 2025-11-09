import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Shield, Clock, Users, Wifi, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HostelRulesProps {
  hostelId: string;
}

const HostelRules = ({ hostelId }: HostelRulesProps) => {
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hostelId) {
      fetchHostelRules();
    }
  }, [hostelId]);

  const fetchHostelRules = async () => {
    try {
      const { data, error } = await supabase
        .from('hostel_rules')
        .select('*')
        .eq('hostel_id', hostelId)
        .eq('is_active', true)
        .order('category')
        .order('title');

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error('Error fetching hostel rules:', error);
      toast({
        title: "Error",
        description: "Failed to load hostel rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'general':
        return <BookOpen className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'timing':
        return <Clock className="h-4 w-4" />;
      case 'visitors':
        return <Users className="h-4 w-4" />;
      case 'internet':
        return <Wifi className="h-4 w-4" />;
      case 'parking':
        return <Car className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'general':
        return 'bg-blue-500';
      case 'security':
        return 'bg-red-500';
      case 'timing':
        return 'bg-orange-500';
      case 'visitors':
        return 'bg-green-500';
      case 'internet':
        return 'bg-purple-500';
      case 'parking':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const groupRulesByCategory = () => {
    const grouped: { [key: string]: any[] } = {};
    rules.forEach(rule => {
      if (!grouped[rule.category]) {
        grouped[rule.category] = [];
      }
      grouped[rule.category].push(rule);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading hostel rules...</p>
        </div>
      </div>
    );
  }

  if (!hostelId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hostel assigned. Contact your administrator.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedRules = groupRulesByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Hostel Rules & Regulations</h2>
        <p className="text-muted-foreground">Important guidelines for hostel residents</p>
      </div>

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Shield className="h-5 w-5" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            All residents are expected to follow these rules and regulations. Violation of any rule may result in disciplinary action. 
            For any clarifications, please contact your hostel warden.
          </p>
        </CardContent>
      </Card>

      {/* Rules by Category */}
      {Object.keys(groupedRules).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No rules have been set for this hostel yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Rules
                </CardTitle>
                <CardDescription>
                  {categoryRules.length} rule(s) in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryRules.map((rule) => (
                    <div key={rule.id} className="border-l-4 border-primary/20 pl-4 py-2">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className={`flex items-center gap-1 ${getCategoryColor(rule.category)} mt-1`}>
                          {getCategoryIcon(rule.category)}
                          {rule.category}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{rule.title}</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-2">
            If you have any questions about these rules or need clarification, please contact:
          </p>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Your Hostel Warden</li>
            <li>• Hostel Reception</li>
            <li>• Submit a complaint through the Student Portal</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HostelRules;