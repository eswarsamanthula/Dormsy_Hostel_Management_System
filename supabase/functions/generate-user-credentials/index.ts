import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to generate random passwords
const generatePassword = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper function to generate user IDs
const generateUserId = (role: 'admin' | 'warden' | 'student', collegeCode: string): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  switch (role) {
    case 'admin':
      return `ADM${year}${collegeCode}${randomNum}`;
    case 'warden':
      return `WRD${year}${collegeCode}${randomNum}`;
    case 'student':
      return `STD${year}${collegeCode}${randomNum}`;
    default:
      return `USR${year}${collegeCode}${randomNum}`;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header missing" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse request body
    const { role, collegeId, count = 1, studentData }: { 
      role: 'warden' | 'student', 
      collegeId: string, 
      count?: number,
      studentData?: { full_name?: string }
    } = await req.json();

    // Check user role and permissions
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Admins can create any role, wardens can only create students
    if (profile.role === 'admin') {
      // Admins can create wardens and students
    } else if (profile.role === 'warden' && role === 'student') {
      // Wardens can only create students
    } else {
      return new Response(JSON.stringify({ error: "Insufficient permissions to generate user credentials" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!role || !collegeId) {
      return new Response(JSON.stringify({ error: "Role and collegeId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get college code
    const { data: college } = await supabaseClient
      .from('colleges')
      .select('code')
      .eq('id', collegeId)
      .single();

    if (!college) {
      return new Response(JSON.stringify({ error: "College not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const credentials = [];

    // Generate credentials for the specified count
    for (let i = 0; i < Math.min(count, 50); i++) { // Limit to 50 at a time
      const userId = generateUserId(role, college.code);
      const password = generatePassword(8);
      const email = `${userId.toLowerCase()}@${college.code.toLowerCase()}.dormsy.edu`;

      try {
        // Create the auth user
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
          email: email,
          password: password,
          user_metadata: {
            full_name: studentData?.full_name || `Generated ${role}`,
            role: role
          },
          email_confirm: true
        });

        if (authError) {
          console.error(`Failed to create user ${email}:`, authError);
          continue; // Skip this user and continue with the next one
        }

        credentials.push({
          userId,
          email,
          password,
          role,
          collegeId,
          authUserId: authUser.user?.id
        });
      } catch (error) {
        console.error(`Error creating user ${email}:`, error);
        continue; // Skip this user and continue with the next one
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      credentials,
      message: `Generated ${credentials.length} ${role} credentials for college ${college.code}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating credentials:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});