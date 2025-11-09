import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Eye, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: unknown;
  user_agent: unknown;
  created_at: string;
  college_id?: string | null;
  hostel_id?: string | null;
  profile?: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

export default function AuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, actionFilter, tableFilter, dateFilter]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter && actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (tableFilter && tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredLogs(filtered);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return '➕';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueTables = [...new Set(logs.map(log => log.table_name).filter(Boolean))];

  const formatJSON = (obj: any) => {
    if (!obj) return 'N/A';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track all system activities and data modifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {uniqueTables.map(table => (
                  <SelectItem key={table} value={table!} className="capitalize">{table}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setActionFilter("all");
                  setTableFilter("all");
                  setDateFilter("");
                }}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={fetchAuditLogs}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} audit logs
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="space-y-1">
            <div className="font-medium">User {log.user_id.slice(0, 8)}...</div>
            <div className="text-xs text-muted-foreground">ID: {log.user_id}</div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {log.profile?.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionColor(log.action)} className="flex items-center gap-1 w-fit">
                            <span>{getActionIcon(log.action)}</span>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize font-mono text-sm">
                            {log.table_name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">
                            {log.record_id ? log.record_id.slice(0, 8) + '...' : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">User Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>User ID: {selectedLog.user_id}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Action Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>Action: <Badge variant={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge></div>
                      <div>Table: <span className="font-mono">{selectedLog.table_name}</span></div>
                      <div>Record ID: <span className="font-mono text-xs">{selectedLog.record_id}</span></div>
                      <div>Timestamp: {new Date(selectedLog.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                {(selectedLog.ip_address || selectedLog.user_agent) && (
                  <div>
                    <h4 className="font-medium mb-2">Technical Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedLog.ip_address && (
                        <div>IP Address: <span className="font-mono">{String(selectedLog.ip_address)}</span></div>
                      )}
                      {selectedLog.user_agent && (
                        <div>User Agent: <span className="font-mono text-xs">{String(selectedLog.user_agent)}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Changes */}
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedLog.old_values && (
                    <div>
                      <h4 className="font-medium mb-2">Old Values</h4>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                        {formatJSON(selectedLog.old_values)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.new_values && (
                    <div>
                      <h4 className="font-medium mb-2">New Values</h4>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">
                        {formatJSON(selectedLog.new_values)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}