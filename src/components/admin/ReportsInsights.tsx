import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, FileText, BarChart3, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";

const ReportsInsights = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [reportType, setReportType] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");

  const { data: colleges } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('colleges').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: reportData } = useQuery({
    queryKey: ['report-data', reportType, selectedCollege, dateRange],
    queryFn: async () => {
      if (!reportType) return null;

      const baseQuery = supabase.from(getTableForReport(reportType)).select('*');
      
      if (selectedCollege && selectedCollege !== 'all') {
        baseQuery.eq('college_id', selectedCollege);
      }
      
      if (dateRange.from) {
        baseQuery.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange.to) {
        baseQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await baseQuery.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!reportType
  });

  const getTableForReport = (type: string) => {
    switch (type) {
      case 'students': return 'students';
      case 'complaints': return 'complaints';
      case 'leave_requests': return 'leave_requests';
      case 'attendance': return 'attendance';
      case 'fee_records': return 'fee_records';
      default: return 'students';
    }
  };

  const getReportColumns = (type: string) => {
    switch (type) {
      case 'students':
        return ['Student ID', 'College', 'Hostel', 'Course', 'Year', 'Created Date'];
      case 'complaints':
        return ['Title', 'Category', 'Priority', 'Status', 'Created Date', 'Resolution'];
      case 'leave_requests':
        return ['Student', 'Type', 'Start Date', 'End Date', 'Status', 'Reason'];
      case 'attendance':
        return ['Student', 'Date', 'Room Attendance', 'Mess Attendance'];
      case 'fee_records':
        return ['Student', 'Fee Type', 'Amount', 'Status', 'Due Date', 'Paid Date'];
      default:
        return [];
    }
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = getReportColumns(reportType);
    const csvContent = [
      headers.join(','),
      ...reportData.map((row: any) => {
        switch (reportType) {
          case 'students':
            return [
              row.student_id || '',
              row.college_id || '',
              row.hostel_id || '',
              row.course || '',
              row.year_of_study || '',
              format(new Date(row.created_at), 'yyyy-MM-dd')
            ].join(',');
          case 'complaints':
            return [
              `"${row.title || ''}"`,
              row.category || '',
              row.priority || '',
              row.status || '',
              format(new Date(row.created_at), 'yyyy-MM-dd'),
              `"${row.resolution_notes || ''}"`
            ].join(',');
          case 'leave_requests':
            return [
              row.student_id || '',
              row.leave_type || '',
              row.start_date || '',
              row.end_date || '',
              row.status || '',
              `"${row.reason || ''}"`
            ].join(',');
          case 'attendance':
            return [
              row.student_id || '',
              row.date || '',
              row.room_attendance ? 'Present' : 'Absent',
              row.mess_attendance ? 'Present' : 'Absent'
            ].join(',');
          case 'fee_records':
            return [
              row.student_id || '',
              row.fee_type || '',
              row.amount || '',
              row.status || '',
              row.due_date || '',
              row.paid_date || ''
            ].join(',');
          default:
            return '';
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: 'Report exported successfully' });
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Reports</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">{reportData?.length || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Colleges</p>
                <p className="text-2xl font-bold">{colleges?.length || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Export Formats</p>
                <p className="text-2xl font-bold">CSV</p>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">Student Records</SelectItem>
                  <SelectItem value="complaints">Complaints Report</SelectItem>
                  <SelectItem value="leave_requests">Leave Requests</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="fee_records">Fee Records</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">College (Optional)</label>
              <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                <SelectTrigger>
                  <SelectValue placeholder="All colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges?.map((college: any) => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from!,
                      to: dateRange.to
                    }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {reportData && reportData.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary">{reportData.length} records</Badge>
                  <Badge variant="outline">{reportType.replace('_', ' ')}</Badge>
                </div>
                <Button onClick={exportToCSV} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getReportColumns(reportType).map((column, index) => (
                        <TableHead key={index}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.slice(0, 10).map((row: any, index: number) => (
                      <TableRow key={index}>
                        {reportType === 'students' && (
                          <>
                            <TableCell className="font-mono">{row.student_id}</TableCell>
                            <TableCell>{row.college_id}</TableCell>
                            <TableCell>{row.hostel_id}</TableCell>
                            <TableCell>{row.course}</TableCell>
                            <TableCell>{row.year_of_study}</TableCell>
                            <TableCell>{format(new Date(row.created_at), 'MMM dd, yyyy')}</TableCell>
                          </>
                        )}
                        {reportType === 'complaints' && (
                          <>
                            <TableCell className="font-medium">{row.title}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell>
                              <Badge variant={row.priority === 'high' ? 'destructive' : row.priority === 'medium' ? 'default' : 'secondary'}>
                                {row.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={row.status === 'resolved' ? 'default' : 'outline'}>
                                {row.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(row.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="max-w-xs truncate">{row.resolution_notes}</TableCell>
                          </>
                        )}
                        {/* Add other report type renderings as needed */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {reportData.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing first 10 of {reportData.length} records. Export to see all data.
                </p>
              )}
            </>
          )}

          {reportType && reportData && reportData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No data found for the selected criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsInsights;