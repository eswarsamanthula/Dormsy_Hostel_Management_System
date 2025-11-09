import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id || !user?.email) throw new Error("User not authenticated or missing email");

    const body = await req.json().catch(() => ({}));
    const { fee_record_id } = body as { fee_record_id?: string };
    if (!fee_record_id) throw new Error("fee_record_id is required");

    // Fetch fee record and validate ownership via the students table
    const { data: feeRecord, error: feeError } = await supabaseService
      .from("fee_records")
      .select("id, amount, paid_amount, fee_type, student_id")
      .eq("id", fee_record_id)
      .maybeSingle();
    if (feeError) throw new Error(`Failed to fetch fee record: ${feeError.message}`);
    if (!feeRecord) throw new Error("Fee record not found");

    const { data: student, error: studentError } = await supabaseService
      .from("students")
      .select("id, profile_id, college_id, hostel_id")
      .eq("id", feeRecord.student_id)
      .maybeSingle();
    if (studentError) throw new Error(`Failed to fetch student: ${studentError.message}`);
    if (!student) throw new Error("Student not found for fee record");

    if (student.profile_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized to pay this fee" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const amountNum = Number(feeRecord.amount || 0);
    const paidNum = Number(feeRecord.paid_amount || 0);
    const outstanding = Math.max(0, amountNum - paidNum);
    if (outstanding <= 0) {
      return new Response(JSON.stringify({ error: "No outstanding amount to pay" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    // Find or use email for customer
    let customerId: string | undefined = undefined;
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const origin = req.headers.get("origin") || Deno.env.get("PROJECT_URL") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Fee Payment - ${feeRecord.fee_type ?? "Hostel"}`,
            },
            unit_amount: Math.round(outstanding * 100), // paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancel`,
      metadata: {
        user_id: user.id,
        fee_record_id,
      },
    });

    // Record payment intent in DB as pending and link to fee record
    await supabaseService.from("payments").insert({
      user_id: user.id,
      fee_record_id,
      stripe_session_id: session.id,
      amount: Math.round(outstanding * 100),
      currency: "inr",
      status: "pending",
    });

    await supabaseService
      .from("fee_records")
      .update({ stripe_session_id: session.id })
      .eq("id", fee_record_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-payment] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});