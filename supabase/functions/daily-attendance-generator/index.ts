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
    console.log(`Generating daily attendance records for ${today}`);

    // Get all active hostels
    const { data: hostels, error: hostelsError } = await supabase
      .from('hostels')
      .select('id, name')
      .eq('is_active', true);

    if (hostelsError) {
      console.error('Error fetching hostels:', hostelsError);
      throw hostelsError;
    }

    console.log(`Found ${hostels?.length || 0} active hostels`);

    let totalGenerated = 0;
    
    for (const hostel of hostels || []) {
      console.log(`Processing hostel: ${hostel.name}`);
      
      // Get all active students in this hostel
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, college_id, hostel_id, student_id')
        .eq('hostel_id', hostel.id);

      if (studentsError) {
        console.error(`Error fetching students for hostel ${hostel.name}:`, studentsError);
        continue;
      }

      console.log(`Found ${students?.length || 0} students in ${hostel.name}`);

      // Generate room attendance records
      for (const student of students || []) {
        // Check if room attendance record already exists
        const { data: existingRoom } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', student.id)
          .eq('date', today)
          .eq('attendance_type', 'room')
          .single();

        if (!existingRoom) {
          const { error: roomError } = await supabase
            .from('attendance')
            .insert({
              student_id: student.id,
              college_id: student.college_id,
              hostel_id: student.hostel_id,
              date: today,
              attendance_type: 'room',
              status: null, // Will be marked by warden
              room_attendance: null,
              mess_attendance: null
            });

          if (roomError) {
            console.error(`Error creating room attendance for student ${student.student_id}:`, roomError);
          } else {
            totalGenerated++;
          }
        }

        // Generate mess attendance records for each meal
        const meals = ['breakfast', 'lunch', 'dinner'];
        for (const meal of meals) {
          const { data: existingMess } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', student.id)
            .eq('date', today)
            .eq('attendance_type', 'mess')
            .eq('meal_type', meal)
            .single();

          if (!existingMess) {
            const { error: messError } = await supabase
              .from('attendance')
              .insert({
                student_id: student.id,
                college_id: student.college_id,
                hostel_id: student.hostel_id,
                date: today,
                attendance_type: 'mess',
                meal_type: meal,
                status: 'skipped', // Default to skipped, students will mark attending
                room_attendance: null,
                mess_attendance: false
              });

            if (messError) {
              console.error(`Error creating mess attendance for student ${student.student_id}, meal ${meal}:`, messError);
            } else {
              totalGenerated++;
            }
          }
        }
      }
    }

    // Send notification to admins about daily attendance generation
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    for (const admin of admins || []) {
      await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          title: 'Daily Attendance Records Generated',
          message: `Generated ${totalGenerated} attendance records for ${today}`,
          type: 'system',
          category: 'admin'
        });
    }

    console.log(`Successfully generated ${totalGenerated} attendance records for ${today}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated ${totalGenerated} attendance records for ${today}`,
        date: today,
        hostels_processed: hostels?.length || 0,
        records_generated: totalGenerated
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in daily-attendance-generator:', error);
    
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