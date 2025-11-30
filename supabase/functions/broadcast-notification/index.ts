import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BroadcastRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'complaint' | 'leave' | 'fee' | 'visitor' | 'attendance' | 'system';
  targetRoles: string[];
  expires_at?: string | null;
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

    // Get the authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Only admins can send broadcast notifications');
    }

    const body: BroadcastRequest = await req.json();
    const { title, message, type, category, targetRoles, expires_at } = body;

    // Validate input
    if (!title?.trim() || !message?.trim() || !targetRoles?.length) {
      throw new Error('Title, message, and target roles are required');
    }

    console.log('Broadcasting notification:', { title, targetRoles });

    // Get all users with the target roles
    const { data: targetUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', targetRoles)
      .eq('is_active', true);

    if (usersError) {
      throw new Error(`Failed to fetch target users: ${usersError.message}`);
    }

    console.log(`Found ${targetUsers?.length || 0} target users`);

    if (!targetUsers || targetUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active users found for the specified roles',
          sentCount: 0 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create notification records for each target user
    const notifications = targetUsers.map(user => ({
      user_id: user.id,
      title: title.trim(),
      message: message.trim(),
      type,
      category,
      is_read: false,
      action_url: null,
      expires_at: expires_at || null,
      created_at: new Date().toISOString(),
    }));

    console.log(`Inserting ${notifications.length} notifications`);

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      throw new Error(`Failed to insert notifications: ${insertError.message}`);
    }

    console.log('Broadcast notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Broadcast notification sent successfully',
        sentCount: notifications.length,
        targetRoles 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in broadcast-notification function:', error);
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