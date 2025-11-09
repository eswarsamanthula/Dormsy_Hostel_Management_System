import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionNotificationRequest {
  action: 'complaint_created' | 'complaint_resolved' | 'leave_created' | 'leave_approved' | 'leave_rejected' | 'visitor_created' | 'visitor_approved' | 'fee_updated';
  student_id?: string;
  warden_id?: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ActionNotificationRequest = await req.json();
    const { action, student_id, warden_id, data } = body;

    console.log('Processing notification action:', { action, student_id, warden_id });

    let notifications: any[] = [];

    switch (action) {
      case 'complaint_created':
        // Notify wardens in the same hostel
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('hostel_id, profiles:profile_id(full_name)')
            .eq('id', student_id)
            .single();

          if (student?.hostel_id) {
            const { data: wardens } = await supabase
              .from('wardens')
              .select('profile_id')
              .eq('hostel_id', student.hostel_id);

            notifications = wardens?.map(warden => ({
              user_id: warden.profile_id,
              title: 'New Complaint Submitted',
              message: `${student.profiles?.full_name || 'A student'} has submitted a new complaint: "${data.title}"`,
              type: 'info',
              category: 'complaint'
            })) || [];
          }
        }
        break;

      case 'complaint_resolved':
        // Notify the student who created the complaint
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('profile_id')
            .eq('id', student_id)
            .single();

          if (student) {
            notifications = [{
              user_id: student.profile_id,
              title: 'Complaint Resolved',
              message: `Your complaint "${data.title}" has been resolved.`,
              type: 'success',
              category: 'complaint'
            }];
          }
        }
        break;

      case 'leave_created':
        // Notify wardens in the same hostel
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('hostel_id, profiles:profile_id(full_name)')
            .eq('id', student_id)
            .single();

          if (student?.hostel_id) {
            const { data: wardens } = await supabase
              .from('wardens')
              .select('profile_id')
              .eq('hostel_id', student.hostel_id);

            notifications = wardens?.map(warden => ({
              user_id: warden.profile_id,
              title: 'New Leave Request',              
              message: `${student.profiles?.full_name || 'A student'} has requested ${data.leave_type} leave from ${data.start_date} to ${data.end_date}`,
              type: 'info',
              category: 'leave'
            })) || [];
          }
        }
        break;

      case 'leave_approved':
        // Notify the student
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('profile_id')
            .eq('id', student_id)
            .single();

          if (student) {
            notifications = [{
              user_id: student.profile_id,
              title: 'Leave Request Approved',
              message: `Your ${data.leave_type} leave request from ${data.start_date} to ${data.end_date} has been approved.`,
              type: 'success',
              category: 'leave'
            }];
          }
        }
        break;

      case 'leave_rejected':
        // Notify the student
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('profile_id')
            .eq('id', student_id)
            .single();

          if (student) {
            notifications = [{
              user_id: student.profile_id,
              title: 'Leave Request Rejected',
              message: `Your ${data.leave_type} leave request from ${data.start_date} to ${data.end_date} has been rejected.`,
              type: 'error',
              category: 'leave'
            }];
          }
        }
        break;

      case 'visitor_created':
        // Notify wardens in the same hostel
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('hostel_id, profiles:profile_id(full_name)')
            .eq('id', student_id)
            .single();

          if (student?.hostel_id) {
            const { data: wardens } = await supabase
              .from('wardens')
              .select('profile_id')
              .eq('hostel_id', student.hostel_id);

            notifications = wardens?.map(warden => ({
              user_id: warden.profile_id,
              title: 'New Visitor Request',
              message: `${student.profiles?.full_name || 'A student'} has requested visitor access for ${data.visitor_name} on ${data.visit_date}`,
              type: 'info',
              category: 'visitor'
            })) || [];
          }
        }
        break;

      case 'visitor_approved':
        // Notify the student
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('profile_id')
            .eq('id', student_id)
            .single();

          if (student) {
            notifications = [{
              user_id: student.profile_id,
              title: 'Visitor Request Approved',
              message: `Your visitor request for ${data.visitor_name} on ${data.visit_date} has been approved.`,
              type: 'success', 
              category: 'visitor'
            }];
          }
        }
        break;

      case 'fee_updated':
        // Notify the student
        if (student_id) {
          const { data: student } = await supabase
            .from('students')
            .select('profile_id')
            .eq('id', student_id)
            .single();

          if (student) {
            notifications = [{
              user_id: student.profile_id,
              title: 'Fee Record Updated',
              message: `Your ${data.fee_type} fee record has been updated. Amount: ₹${data.amount}`,
              type: 'info',
              category: 'fee'
            }];
          }
        }
        break;
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications.map(notif => ({
          ...notif,
          is_read: false,
          created_at: new Date().toISOString(),
        })));

      if (insertError) {
        throw new Error(`Failed to create notifications: ${insertError.message}`);
      }

      console.log(`Created ${notifications.length} notifications for action: ${action}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${notifications.length} notifications`,
        count: notifications.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in notify-on-action function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);