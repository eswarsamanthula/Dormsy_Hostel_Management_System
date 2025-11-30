import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a secure random password
function generatePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Reset student password request received');

    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { userId, studentId } = await req.json();

    if (!userId || !studentId) {
      throw new Error('Missing required fields: userId and studentId');
    }

    console.log(`Resetting password for user: ${userId}, student: ${studentId}`);

    // Verify the requesting user is a warden
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'warden') {
      console.error('Permission check failed:', profileError);
      throw new Error('Only wardens can reset student passwords');
    }

    // Verify the student belongs to the warden's hostel
    const { data: wardenData } = await supabaseClient
      .from('wardens')
      .select('hostel_id')
      .eq('profile_id', user.id)
      .single();

    if (!wardenData) {
      throw new Error('Warden information not found');
    }

    const { data: studentData } = await supabaseClient
      .from('students')
      .select('hostel_id')
      .eq('profile_id', userId)
      .single();

    if (!studentData || studentData.hostel_id !== wardenData.hostel_id) {
      throw new Error('Student not found in your hostel');
    }

    // Generate new password
    const newPassword = generatePassword(12);

    // Update the user's password using admin API
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log(`Password reset successfully for student: ${studentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        password: newPassword,
        message: 'Password reset successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in reset-student-password function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while resetting the password'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
