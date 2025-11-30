import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    console.log(`Checking attendance notifications for ${today} at hour ${currentHour}`);

    // Check for students with poor attendance (less than 70% in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Get attendance statistics for the last 7 days
    const { data: attendanceStats, error: statsError } = await supabase
      .from('attendance')
      .select(`
        student_id,
        status,
        attendance_type,
        students!inner(
          student_id,
          profiles!inner(full_name),
          hostels!inner(name)
        )
      `)
      .gte('date', sevenDaysAgoStr)
      .lte('date', today);

    if (statsError) {
      console.error('Error fetching attendance stats:', statsError);
      throw statsError;
    }

    // Group by student and calculate attendance rates
    const studentStats = new Map();
    
    attendanceStats?.forEach(record => {
      const studentId = record.student_id;
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          student: record.students,
          totalRecords: 0,
          presentRecords: 0
        });
      }
      
      const stats = studentStats.get(studentId);
      stats.totalRecords++;
      
      if (record.status === 'present') {
        stats.presentRecords++;
      }
    });

    // Find students with poor attendance
    const poorAttendanceStudents = [];
    for (const [studentId, stats] of studentStats) {
      const attendanceRate = stats.totalRecords > 0 ? (stats.presentRecords / stats.totalRecords) * 100 : 0;
      
      if (attendanceRate < 70 && stats.totalRecords >= 5) { // At least 5 records to be meaningful
        poorAttendanceStudents.push({
          studentId,
          attendanceRate: Math.round(attendanceRate),
          student: stats.student
        });
      }
    }

    console.log(`Found ${poorAttendanceStudents.length} students with poor attendance`);

    // Send notifications to wardens about poor attendance
    for (const studentData of poorAttendanceStudents) {
      // Get the warden for this student's hostel
      const { data: wardens } = await supabase
        .from('wardens')
        .select('profile_id')
        .eq('hostel_id', studentData.student.hostels?.id);

      // Send notification to wardens
      for (const warden of wardens || []) {
        await supabase
          .from('notifications')
          .insert({
            user_id: warden.profile_id,
            title: 'Poor Attendance Alert',
            message: `Student ${studentData.student.profiles?.full_name} (${studentData.student.student_id}) has ${studentData.attendanceRate}% attendance in the last 7 days`,
            type: 'alert',
            category: 'warden',
            action_url: '/warden/attendance'
          });
      }

      // Send notification to student
      const { data: studentProfile } = await supabase
        .from('students')
        .select('profile_id')
        .eq('id', studentData.studentId)
        .single();

      if (studentProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: studentProfile.profile_id,
            title: 'Attendance Warning',
            message: `Your attendance is ${studentData.attendanceRate}% in the last 7 days. Please maintain regular attendance to avoid disciplinary action.`,
            type: 'warning',
            category: 'student',
            action_url: '/student/attendance'
          });
      }
    }

    // Check for missed meal cut-offs and send reminders
    let mealReminders = 0;
    
    if (currentHour === 6) { // 6 AM - breakfast reminder
      mealReminders = await sendMealReminders(supabase, 'breakfast');
    } else if (currentHour === 11) { // 11 AM - lunch reminder  
      mealReminders = await sendMealReminders(supabase, 'lunch');
    } else if (currentHour === 18) { // 6 PM - dinner reminder
      mealReminders = await sendMealReminders(supabase, 'dinner');
    }

    console.log(`Sent ${mealReminders} meal reminders`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Attendance notifications processed successfully',
        poor_attendance_alerts: poorAttendanceStudents.length,
        meal_reminders: mealReminders,
        date: today,
        hour: currentHour
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in attendance-notifications:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function sendMealReminders(supabase: any, mealType: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  let remindersSent = 0;

  // Get all students who haven't marked their attendance for this meal yet
  const { data: studentsWithoutAttendance, error } = await supabase
    .from('students')
    .select(`
      id, 
      profile_id, 
      student_id,
      profiles!inner(full_name)
    `)
    .not('id', 'in', `(
      SELECT student_id 
      FROM attendance 
      WHERE date = '${today}' 
      AND attendance_type = 'mess' 
      AND meal_type = '${mealType}'
      AND status = 'present'
    )`);

  if (error) {
    console.error('Error fetching students for meal reminders:', error);
    return 0;
  }

  // Send reminder to each student
  for (const student of studentsWithoutAttendance || []) {
    await supabase
      .from('notifications')
      .insert({
        user_id: student.profile_id,
        title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Reminder`,
        message: `Don't forget to mark your ${mealType} attendance! Cut-off time is approaching.`,
        type: 'reminder',
        category: 'student',
        action_url: '/student/mess-attendance',
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // Expire in 2 hours
      });
    
    remindersSent++;
  }

  return remindersSent;
}