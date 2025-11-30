import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  title: string;  
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'complaint' | 'leave' | 'fee' | 'visitor' | 'attendance' | 'system';
  action_url?: string | null;
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

    const body: NotificationRequest = await req.json();
    const { user_id, title, message, type, category, action_url, expires_at } = body;

    // Validate input
    if (!user_id || !title?.trim() || !message?.trim()) {
      throw new Error('User ID, title, and message are required');
    }

    console.log('Creating notification:', { user_id, title, type, category });

    // Create notification record
    const { error: insertError } = await supabase
      .from('notifications')
      .insert([{
        user_id,
        title: title.trim(),
        message: message.trim(),
        type,
        category,
        is_read: false,
        action_url: action_url || null,
        expires_at: expires_at || null,
        created_at: new Date().toISOString(),
      }]);

    if (insertError) {
      throw new Error(`Failed to create notification: ${insertError.message}`);
    }

    console.log('Notification created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
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