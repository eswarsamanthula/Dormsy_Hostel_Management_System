import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Utensils, Coffee, Sun, Moon, Cookie, Calendar, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessMenuItem {
  id: string;
  name: string;
  description: string;
  meal_type: string;
  day_of_week: number;
  is_vegetarian: boolean;
  is_template: boolean;
  created_at: string;
}

const MessMenuManagement = () => {
  const [weeklyTemplate, setWeeklyTemplate] = useState<{ [key: number]: MessMenuItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    meal_type: '',
    day_of_week: 1, // Monday by default
    is_vegetarian: false
  });
  const { toast } = useToast();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekDays = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

  useEffect(() => {
    fetchWeeklyTemplate();
  }, []);

  const fetchWeeklyTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData, error: wardenError } = await supabase
        .from('wardens')
        .select('hostel_id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (wardenError) throw wardenError;
      if (!wardenData) throw new Error('Warden information not found');

      const { data, error } = await supabase
        .from('mess_menu')
        .select('*')
        .eq('hostel_id', wardenData.hostel_id)
        .eq('is_template', true)
        .order('day_of_week', { ascending: true })
        .order('meal_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Group items by day of week (ensure numeric comparison)
      const groupedItems: { [key: number]: MessMenuItem[] } = {};
      const normalized = (data || []).map((item) => ({
        ...item,
        day_of_week: typeof (item as any).day_of_week === 'string' ? parseInt((item as any).day_of_week, 10) : (item as any).day_of_week,
      })) as MessMenuItem[];
      weekDays.forEach((day) => {
        groupedItems[day] = normalized.filter((item) => item.day_of_week === day);
      });
      
      setWeeklyTemplate(groupedItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch weekly template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async () => {
    try {
      // Get current warden's college and hostel info
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData, error: wardenError } = await supabase
        .from('wardens')
        .select('college_id, hostel_id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (wardenError) throw wardenError;
      if (!wardenData) throw new Error('Warden information not found');

      const { error } = await supabase
        .from('mess_menu')
        .insert({
          ...newMenuItem,
          college_id: wardenData.college_id,
          hostel_id: wardenData.hostel_id,
          is_template: true,
          date: null // Templates don't have specific dates
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item added to weekly template",
      });

      setIsAddDialogOpen(false);
      setNewMenuItem({
        name: '',
        description: '',
        meal_type: '',
        day_of_week: 1,
        is_vegetarian: false
      });
      fetchWeeklyTemplate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add menu item",
        variant: "destructive",
      });
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('mess_menu')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted from template",
      });

      fetchWeeklyTemplate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const applyTemplateToAllWeeks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: wardenData, error: wardenError } = await supabase
        .from('wardens')
        .select('college_id, hostel_id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (wardenError) throw wardenError;
      if (!wardenData) throw new Error('Warden information not found');

      // Delete all non-template entries for this hostel
      const { error: deleteError } = await supabase
        .from('mess_menu')
        .delete()
        .eq('hostel_id', wardenData.hostel_id)
        .eq('is_template', false);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Weekly template is now active for all weeks. Menu will be generated automatically based on your template.",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply template",
        variant: "destructive",
      });
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="h-4 w-4" />;
      case 'lunch': return <Sun className="h-4 w-4" />;
      case 'dinner': return <Moon className="h-4 w-4" />;
      case 'snacks': return <Cookie className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800';
      case 'lunch': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800';
      case 'dinner': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-800';
      case 'snacks': return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-200 dark:border-pink-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800';
    }
  };

  const getMealTypeItems = (items: MessMenuItem[], mealType: string) => {
    return items.filter(item => item.meal_type === mealType);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading weekly template...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Weekly Menu Template</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={applyTemplateToAllWeeks}>
                <Save className="h-4 w-4 mr-2" />
                Apply to All Weeks
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Menu Item to Template</DialogTitle>
                    <DialogDescription>
                      Add a new item to your weekly menu template. This will apply to all weeks.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                        placeholder="e.g., Chicken Curry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newMenuItem.description}
                        onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                        placeholder="Brief description of the dish"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meal_type">Meal Type</Label>
                      <Select value={newMenuItem.meal_type} onValueChange={(value) => setNewMenuItem({...newMenuItem, meal_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snacks">Snacks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day_of_week">Day of Week</Label>
                      <Select value={newMenuItem.day_of_week.toString()} onValueChange={(value) => setNewMenuItem({...newMenuItem, day_of_week: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {dayNames[day]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="vegetarian"
                        checked={newMenuItem.is_vegetarian}
                        onCheckedChange={(checked) => setNewMenuItem({...newMenuItem, is_vegetarian: checked})}
                      />
                      <Label htmlFor="vegetarian">Vegetarian</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addMenuItem} disabled={!newMenuItem.name || !newMenuItem.meal_type}>
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Weekly Template Mode</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  You're managing a weekly menu template. Changes you make here will automatically apply to all weeks. 
                  Click "Apply to All Weeks" after making changes to ensure the template is active.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Template Display */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((dayOfWeek) => {
          const dayItems = weeklyTemplate[dayOfWeek] || [];
          
          return (
            <Card key={dayOfWeek} className="hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-primary">{dayNames[dayOfWeek]}</span>
                    <Badge variant="secondary" className="text-xs">
                      {dayItems.length} items
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                  const mealItems = getMealTypeItems(dayItems, mealType);
                  return (
                    <div key={mealType} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-1 ${getMealColor(mealType)}`}
                        >
                          <span className="flex items-center space-x-1">
                            {getMealIcon(mealType)}
                            <span className="capitalize">{mealType}</span>
                          </span>
                        </Badge>
                      </div>
                      {mealItems.length > 0 ? (
                        <div className="space-y-1">
                          {mealItems.map((item) => (
                            <div key={item.id} className="group bg-muted/30 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {item.name}
                                    </p>
                                    {item.is_vegetarian && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                        Veg
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                  onClick={() => deleteMenuItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic py-2">
                          No {mealType} items
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {dayItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Utensils className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No menu items for {dayNames[dayOfWeek]}</p>
                    <p className="text-xs mt-1">Add items using the button above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MessMenuManagement;