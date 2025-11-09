import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, FileSpreadsheet, Calendar, Users, Building, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  tables: string[];
  dateRange: {
    start: string;
    end: string;
  };
  includeDeleted: boolean;
}

const AVAILABLE_TABLES = [
  { id: 'profiles', name: 'User Profiles', icon: Users },
  { id: 'colleges', name: 'Colleges', icon: Building },
  { id: 'hostels', name: 'Hostels', icon: Building },
  { id: 'students', name: 'Students', icon: Users },
  { id: 'wardens', name: 'Wardens', icon: Users },
  { id: 'admins', name: 'Admins', icon: Users },
  { id: 'rooms', name: 'Rooms', icon: Building },
  { id: 'complaints', name: 'Complaints', icon: FileText },
  { id: 'leave_requests', name: 'Leave Requests', icon: Calendar },
  { id: 'fee_records', name: 'Fee Records', icon: FileText },
  { id: 'attendance', name: 'Attendance', icon: Calendar },
  { id: 'visitors', name: 'Visitors', icon: Users },
  { id: 'notifications', name: 'Notifications', icon: FileText },
  { id: 'audit_logs', name: 'Audit Logs', icon: Database },
];

export default function DataExport() {
  const { toast } = useToast();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    tables: [],
    dateRange: {
      start: '',
      end: '',
    },
    includeDeleted: false,
  });
  const [exporting, setExporting] = useState(false);

  const handleTableToggle = (tableId: string, checked: boolean) => {
    if (checked) {
      setOptions(prev => ({
        ...prev,
        tables: [...prev.tables, tableId]
      }));
    } else {
      setOptions(prev => ({
        ...prev,
        tables: prev.tables.filter(t => t !== tableId)
      }));
    }
  };

  const selectAllTables = () => {
    setOptions(prev => ({
      ...prev,
      tables: AVAILABLE_TABLES.map(t => t.id)
    }));
  };

  const clearAllTables = () => {
    setOptions(prev => ({
      ...prev,
      tables: []
    }));
  };

  const fetchTableData = async (tableName: string) => {
    let query = (supabase as any).from(tableName).select('*');
    
    // Apply date range filter if specified
    if (options.dateRange.start && options.dateRange.end) {
      query = query
        .gte('created_at', options.dateRange.start)
        .lte('created_at', options.dateRange.end);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    
    return data || [];
  };

  const exportAsCSV = async (data: Record<string, any[]>) => {
    const zip = await import('jszip');
    const zipInstance = new zip.default();
    
    for (const [tableName, tableData] of Object.entries(data)) {
      if (tableData.length === 0) continue;
      
      const headers = Object.keys(tableData[0]);
      const csvContent = [
        headers.join(','),
        ...tableData.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');
      
      zipInstance.file(`${tableName}.csv`, csvContent);
    }
    
    const zipBlob = await zipInstance.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `dormsy-export-${Date.now()}.zip`;
    link.click();
  };

  const exportAsPDF = async (data: Record<string, any[]>) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    pdf.setFontSize(20);
    pdf.text('Dormsy Data Export', 20, yPosition);
    yPosition += 20;
    
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;
    
    for (const [tableName, tableData] of Object.entries(data)) {
      if (tableData.length === 0) continue;
      
      // Add new page if needed
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.text(tableName.toUpperCase(), 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Records: ${tableData.length}`, 20, yPosition);
      yPosition += 15;
      
      // Add summary of first few records
      const sampleData = tableData.slice(0, 3);
      sampleData.forEach((record, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`Record ${index + 1}:`, 20, yPosition);
        yPosition += 5;
        
        Object.entries(record).slice(0, 5).forEach(([key, value]) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          const truncatedValue = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;
          pdf.text(`  ${key}: ${truncatedValue}`, 25, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5;
      });
      
      yPosition += 10;
    }
    
    pdf.save(`dormsy-export-${Date.now()}.pdf`);
  };

  const exportAsJSON = async (data: Record<string, any[]>) => {
    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        tables_included: options.tables,
        date_range: options.dateRange,
        total_records: Object.values(data).reduce((sum, tableData) => sum + tableData.length, 0),
      },
      data,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dormsy-export-${Date.now()}.json`;
    link.click();
  };

  const performExport = async () => {
    if (options.tables.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one table to export",
        variant: "destructive",
      });
      return;
    }
    
    setExporting(true);
    
    try {
      const data: Record<string, any[]> = {};
      
      // Fetch data for each selected table
      for (const tableName of options.tables) {
        try {
          const tableData = await fetchTableData(tableName);
          data[tableName] = tableData;
          
          toast({
            title: "Progress",
            description: `Exported ${tableName}: ${tableData.length} records`,
          });
        } catch (error) {
          console.error(`Failed to export ${tableName}:`, error);
          toast({
            title: "Warning",
            description: `Failed to export ${tableName}`,
            variant: "destructive",
          });
        }
      }
      
      // Export in the selected format
      switch (options.format) {
        case 'csv':
          await exportAsCSV(data);
          break;
        case 'pdf':
          await exportAsPDF(data);
          break;
        case 'json':
          await exportAsJSON(data);
          break;
      }
      
      toast({
        title: "Success",
        description: `Data exported successfully in ${options.format.toUpperCase()} format`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
        <CardDescription>
          Export system data in various formats for backup or analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div>
          <Label className="text-sm font-medium">Export Format</Label>
          <Select
            value={options.format}
            onValueChange={(value: 'csv' | 'pdf' | 'json') =>
              setOptions(prev => ({ ...prev, format: value }))
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Comma Separated Values)
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF (Summary Report)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  JSON (Full Data)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Table Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Select Tables</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllTables}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllTables}>
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_TABLES.map((table) => (
              <div key={table.id} className="flex items-center space-x-2">
                <Checkbox
                  id={table.id}
                  checked={options.tables.includes(table.id)}
                  onCheckedChange={(checked) =>
                    handleTableToggle(table.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={table.id}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <table.icon className="h-4 w-4" />
                  {table.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div>
          <Label className="text-sm font-medium">Date Range (Optional)</Label>
          <div className="grid gap-3 md:grid-cols-2 mt-2">
            <div>
              <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={options.dateRange.start}
                onChange={(e) =>
                  setOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={options.dateRange.end}
                onChange={(e) =>
                  setOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-deleted"
            checked={options.includeDeleted}
            onCheckedChange={(checked) =>
              setOptions(prev => ({ ...prev, includeDeleted: checked as boolean }))
            }
          />
          <Label htmlFor="include-deleted" className="text-sm font-normal">
            Include deleted records (if applicable)
          </Label>
        </div>

        {/* Export Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Export Summary</h4>
          <div className="text-sm space-y-1">
            <div>Format: <span className="font-medium uppercase">{options.format}</span></div>
            <div>Tables: <span className="font-medium">{options.tables.length} selected</span></div>
            {options.dateRange.start && options.dateRange.end && (
              <div>
                Date Range: <span className="font-medium">
                  {options.dateRange.start} to {options.dateRange.end}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={performExport}
          disabled={exporting || options.tables.length === 0}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : `Export ${options.tables.length} Table${options.tables.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}