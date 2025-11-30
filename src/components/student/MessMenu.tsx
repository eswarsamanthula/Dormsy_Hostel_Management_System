import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Coffee, Sun, Moon, Utensils, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessMenuProps {
  hostelId: string;
}

const MessMenu = ({ hostelId }: MessMenuProps) => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hostelId) {
      fetchMessMenu();
    }
  }, [hostelId]);

  const fetchMessMenu = async () => {
    try {
      // Get template menu items for the hostel
      const { data, error } = await supabase
        .from('mess_menu')
        .select('*')
        .eq('hostel_id', hostelId)
        .eq('is_template', true)
        .order('day_of_week', { ascending: true })
        .order('meal_type');

      if (error) throw error;
      
      // Map template items to actual dates for current week
      const today = new Date();
      const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const menuWithDates = (data || []).map(item => {
        // Calculate the date for this day of week in current week
        const daysFromToday = (item.day_of_week - currentDayOfWeek + 7) % 7;
        const itemDate = new Date(today);
        itemDate.setDate(today.getDate() + daysFromToday);
        
        return {
          ...item,
          date: itemDate.toISOString().split('T')[0]
        };
      });
      
      setMenuItems(menuWithDates);
    } catch (error: any) {
      console.error('Error fetching mess menu:', error);
      toast({
        title: "Error",
        description: "Failed to load mess menu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return <Coffee className="h-4 w-4" />;
      case 'lunch':
        return <Sun className="h-4 w-4" />;
      case 'dinner':
        return <Moon className="h-4 w-4" />;
      case 'snacks':
        return <Utensils className="h-4 w-4" />;
      default:
        return <ChefHat className="h-4 w-4" />;
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'bg-orange-500';
      case 'lunch':
        return 'bg-yellow-500';
      case 'dinner':
        return 'bg-blue-500';
      case 'snacks':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const groupMenuByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    menuItems.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
    });
    return grouped;
  };

  const groupMenuByMealType = () => {
    const grouped: { [key: string]: any[] } = {};
    menuItems.forEach(item => {
      if (!grouped[item.meal_type]) {
        grouped[item.meal_type] = [];
      }
      grouped[item.meal_type].push(item);
    });
    return grouped;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mess menu...</p>
        </div>
      </div>
    );
  }

  if (!hostelId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hostel assigned. Contact your administrator.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedByDate = groupMenuByDate();
  const groupedByMealType = groupMenuByMealType();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Mess Menu</h2>
        <p className="text-muted-foreground">View this week's meal schedule</p>
      </div>

      <Tabs defaultValue="by-date" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-date">By Date</TabsTrigger>
          <TabsTrigger value="by-meal">By Meal Type</TabsTrigger>
        </TabsList>

        <TabsContent value="by-date" className="space-y-4">
          {Object.keys(groupedByDate).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No menu items available for this week</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByDate).map(([date, items]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    {formatDate(date)}
                  </CardTitle>
                  <CardDescription>
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`flex items-center gap-1 ${getMealColor(item.meal_type)}`}>
                            {getMealIcon(item.meal_type)}
                            {item.meal_type}
                          </Badge>
                          {item.is_vegetarian && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              <Leaf className="h-3 w-3 mr-1" />
                              Veg
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-2">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="by-meal" className="space-y-4">
          {Object.keys(groupedByMealType).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No menu items available</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByMealType).map(([mealType, items]) => (
              <Card key={mealType}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getMealIcon(mealType)}
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </CardTitle>
                  <CardDescription>
                    {items.length} item(s) scheduled this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            {item.is_vegetarian && (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <Leaf className="h-3 w-3 mr-1" />
                                Veg
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessMenu;