import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCodeGenerator from "qrcode";

interface QRCodeData {
  id: string;
  code_type: string;
  code_data: string;
  expires_at: string | null;
  is_active: boolean;
  usage_count: number;
  max_usage: number | null;
}

interface QRCodeProps {
  studentId: string;
  studentData: any;
}

export default function QRCode({ studentId, studentData }: QRCodeProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile?.id) {
      fetchQRCodes();
    }
  }, [profile?.id]);

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQrCodes(data || []);
      
      // Generate QR code images for each code
      const images: Record<string, string> = {};
      for (const qrCode of data || []) {
        try {
          const qrDataURL = await QRCodeGenerator.toDataURL(qrCode.code_data, {
            width: 200,
            margin: 2,
          });
          images[qrCode.id] = qrDataURL;
        } catch (err) {
          console.error('Failed to generate QR code image:', err);
        }
      }
      setQrImages(images);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch QR codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStudentIdQR = async () => {
    if (!studentData) return;
    
    setGenerating(true);
    try {
      const qrData = {
        type: 'student_id',
        student_id: studentId,
        name: studentData.full_name,
        hostel: studentData.hostel?.name,
        room: studentData.room?.room_number,
        generated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: profile?.id,
          code_type: 'student_id',
          code_data: JSON.stringify(qrData),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          college_id: studentData.college_id,
          hostel_id: studentData.hostel_id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student ID QR code generated successfully",
      });

      fetchQRCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateEntryExitQR = async () => {
    setGenerating(true);
    try {
      const qrData = {
        type: 'entry_exit',
        student_id: studentId,
        session_id: crypto.randomUUID(),
        generated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: profile?.id,
          code_type: 'entry_exit',
          code_data: JSON.stringify(qrData),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          max_usage: 10, // Can be used 10 times
          college_id: studentData?.college_id,
          hostel_id: studentData?.hostel_id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry/Exit QR code generated successfully",
      });

      fetchQRCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = (qrCodeId: string, type: string) => {
    const image = qrImages[qrCodeId];
    if (!image) return;

    const link = document.createElement('a');
    link.download = `${type}-qr-code-${Date.now()}.png`;
    link.href = image;
    link.click();
  };

  const getStatusColor = (qrCode: QRCodeData) => {
    if (!qrCode.is_active) return "secondary";
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) return "destructive";
    if (qrCode.max_usage && qrCode.usage_count >= qrCode.max_usage) return "destructive";
    return "default";
  };

  const getStatusText = (qrCode: QRCodeData) => {
    if (!qrCode.is_active) return "Inactive";
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) return "Expired";
    if (qrCode.max_usage && qrCode.usage_count >= qrCode.max_usage) return "Usage Limit Reached";
    return "Active";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading QR codes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate QR codes for student identification and hostel entry/exit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              onClick={generateStudentIdQR} 
              disabled={generating}
              className="h-auto p-4 flex-col gap-2"
            >
              <QrCode className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Student ID QR</div>
                <div className="text-xs opacity-70">For identification purposes</div>
              </div>
            </Button>
            
            <Button 
              onClick={generateEntryExitQR} 
              disabled={generating}
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
            >
              <QrCode className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Entry/Exit QR</div>
                <div className="text-xs opacity-70">24hr validity, 10 uses</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your QR Codes</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchQRCodes}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No QR codes generated yet. Create your first QR code above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {qrCodes.map((qrCode) => (
                <div key={qrCode.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">
                      {qrCode.code_type.replace('_', ' ')} QR
                    </h4>
                    <Badge variant={getStatusColor(qrCode)}>
                      {getStatusText(qrCode)}
                    </Badge>
                  </div>
                  
                  {qrImages[qrCode.id] && (
                    <div className="flex justify-center">
                      <img 
                        src={qrImages[qrCode.id]} 
                        alt="QR Code" 
                        className="border rounded"
                        width={150}
                        height={150}
                      />
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    {qrCode.expires_at && (
                      <div>Expires: {new Date(qrCode.expires_at).toLocaleDateString()}</div>
                    )}
                    {qrCode.max_usage && (
                      <div>Usage: {qrCode.usage_count}/{qrCode.max_usage}</div>
                    )}
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => downloadQRCode(qrCode.id, qrCode.code_type)}
                    disabled={!qrImages[qrCode.id]}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}