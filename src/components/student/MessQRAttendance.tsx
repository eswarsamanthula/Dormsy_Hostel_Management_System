import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Check, X } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const MessQRAttendance = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudentInfo();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, [profile]);

  const fetchStudentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const getCurrentMealType = (): 'breakfast' | 'lunch' | 'dinner' | null => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 7 && currentHour < 10) return 'breakfast';
    if (currentHour >= 12 && currentHour < 14) return 'lunch';
    if (currentHour >= 19 && currentHour < 21) return 'dinner';
    
    return null;
  };

  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      setScanning(true);
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          onDecodeError: () => {}, // Ignore decode errors
          preferredCamera: 'environment'
        }
      );
      
      await scannerRef.current.start();
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast({
        title: "Camera Error",
        description: "Failed to start camera. Please check permissions.",
        variant: "destructive",
      });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanResult = async (qrData: string) => {
    setLastScan(qrData);
    
    try {
      // Parse QR code data (expected format: "mess_attendance:HOSTEL_ID:DATE:MEAL_TYPE")
      const [prefix, hostelId, date, mealType] = qrData.split(':');
      
      if (prefix !== 'mess_attendance') {
        throw new Error('Invalid QR code format');
      }
      
      const currentMeal = getCurrentMealType();
      if (!currentMeal) {
        throw new Error('No active meal time');
      }
      
      if (mealType !== currentMeal) {
        throw new Error(`QR code is for ${mealType}, but current meal is ${currentMeal}`);
      }
      
      if (hostelId !== student.hostel_id) {
        throw new Error('QR code is not for your hostel');
      }
      
      const today = format(new Date(), 'yyyy-MM-dd');
      if (date !== today) {
        throw new Error('QR code is not for today');
      }
      
      // Mark attendance
      const { data: existingRecord, error: fetchError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', student.id)
        .eq('date', today)
        .eq('attendance_type', 'mess')
        .eq('meal_type', currentMeal)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let error;
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            status: 'present',
            mess_attendance: true,
            marked_by: profile?.id,
            self_marked: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('attendance')
          .insert({
            student_id: student.id,
            date: today,
            college_id: student.college_id,
            hostel_id: student.hostel_id,
            attendance_type: 'mess',
            meal_type: currentMeal,
            status: 'present',
            mess_attendance: true,
            marked_by: profile?.id,
            self_marked: true
          });
        error = insertError;
      }
      
      if (error) throw error;
      
      toast({
        title: "Attendance Marked",
        description: `Successfully marked ${currentMeal} attendance via QR scan`,
      });
      
      stopScanning();
      
    } catch (error: any) {
      toast({
        title: "Scan Error",
        description: error.message || "Failed to process QR code",
        variant: "destructive",
      });
    }
  };

  const currentMeal = getCurrentMealType();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentMeal ? (
            <div className="text-center space-y-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                Current Meal: {currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)}
              </Badge>
              
              {!scanning ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Scan the QR code at the mess entrance to mark your attendance
                  </p>
                  <Button onClick={startScanning} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Start QR Scanner
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-w-sm mx-auto">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-4 border-2 border-white rounded-lg pointer-events-none">
                      <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary"></div>
                    </div>
                  </div>
                  <Button onClick={stopScanning} variant="outline" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
                No Active Meal Time
              </Badge>
              <p className="text-muted-foreground">
                QR attendance is only available during meal times:
                <br />• Breakfast: 7:00 AM - 10:00 AM
                <br />• Lunch: 12:00 PM - 2:00 PM  
                <br />• Dinner: 7:00 PM - 9:00 PM
              </p>
            </div>
          )}
          
          {lastScan && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Last Scan:</p>
              <p className="text-xs text-muted-foreground break-all">{lastScan}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessQRAttendance;