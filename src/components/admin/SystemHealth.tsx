import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  HardDrive,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ElementType;
  description: string;
}

const SystemHealth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      icon: Activity,
      description: 'Server processing power utilization'
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 67,
      unit: '%',
      status: 'warning',
      icon: HardDrive,
      description: 'RAM utilization across all services'
    },
    {
      id: 'database',
      name: 'Database',
      value: 98,
      unit: '%',
      status: 'healthy',
      icon: Database,
      description: 'Database connection and response time'
    },
    {
      id: 'network',
      name: 'Network',
      value: 89,
      unit: '%',
      status: 'healthy',
      icon: Wifi,
      description: 'Network connectivity and bandwidth'
    },
    {
      id: 'storage',
      name: 'Storage',
      value: 78,
      unit: '%',
      status: 'warning',
      icon: Server,
      description: 'Disk space usage and availability'
    },
    {
      id: 'active_users',
      name: 'Active Users',
      value: 156,
      unit: '',
      status: 'healthy',
      icon: Users,
      description: 'Currently active users on the platform'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
      case 'critical':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to refresh metrics
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random metric updates
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.id === 'active_users' 
          ? Math.floor(Math.random() * 200 + 100)
          : Math.floor(Math.random() * 100 + 1),
        status: Math.random() > 0.8 ? 'warning' : 'healthy'
      })));
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const healthyCount = metrics.filter(m => m.status === 'healthy').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const criticalCount = metrics.filter(m => m.status === 'critical').length;

  const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">System Health Monitor</h2>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button onClick={refreshMetrics} disabled={isLoading} variant="outline">
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {React.createElement(getStatusIcon(overallStatus), { 
                className: `h-5 w-5 ${getStatusColor(overallStatus)}` 
              })}
              System Status
            </CardTitle>
            <Badge 
              variant={overallStatus === 'healthy' ? 'default' : 'destructive'}
              className={overallStatus === 'healthy' ? 'bg-success' : ''}
            >
              {overallStatus.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-success">{healthyCount}</div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-warning">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warning</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          const StatusIcon = getStatusIcon(metric.status);
          
          return (
            <Card key={metric.id} className="hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{metric.name}</CardTitle>
                  </div>
                  <StatusIcon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(metric.status)}
                  >
                    {metric.status}
                  </Badge>
                </div>
                
                {metric.unit === '%' && (
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                  />
                )}
                
                <CardDescription className="text-xs">
                  {metric.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>
            System notifications and alerts from the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">High Memory Usage Detected</p>
                <p className="text-xs text-muted-foreground">Memory usage exceeded 80% threshold at 14:30</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Database Backup Completed</p>
                <p className="text-xs text-muted-foreground">Scheduled backup completed successfully at 02:00</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Activity className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">System Maintenance Scheduled</p>
                <p className="text-xs text-muted-foreground">Routine maintenance scheduled for tomorrow at 03:00 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;