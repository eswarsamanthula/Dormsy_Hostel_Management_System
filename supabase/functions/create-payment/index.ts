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

  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");

    // Decode JWT locally (Supabase already verified signature at the edge)
    type JwtPayload = { sub?: string; email?: string; user_metadata?: { email?: string } };
    let payload: JwtPayload | null = null;
    try {
      payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch (_e) {
      throw new Error("Invalid JWT token");
    }

    const user = {
      id: payload?.sub ?? "",
      email: payload?.email ?? payload?.user_metadata?.email ?? undefined,
    };
    if (!user.id) throw new Error("User not authenticated (no sub in JWT)");

    // Fallback: fetch email from profiles if not in JWT
    if (!user.email) {
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();
      user.email = profile?.email;
    }

    const body = await req.json().catch(() => ({}));
    const { fee_record_id, fine_id } = body as { fee_record_id?: string; fine_id?: string };
    
    let recordType: 'fee' | 'fine';
    let recordId: string;
    let amount: number;
    let description: string;
    let studentId: string;

    // Determine if this is a fine or fee payment
    if (fine_id) {
      recordType = 'fine';
      recordId = fine_id;

      // Fetch fine record
      const { data: fineRecord, error: fineError } = await supabaseService
        .from("fines")
        .select("id, amount, fine_reason, student_id, status")
        .eq("id", fine_id)
        .maybeSingle();
      if (fineError) throw new Error(`Failed to fetch fine: ${fineError.message}`);
      if (!fineRecord) throw new Error("Fine not found");
      if (fineRecord.status === 'paid') throw new Error("Fine already paid");

      amount = Number(fineRecord.amount || 0);
      description = `Fine Payment - ${fineRecord.fine_reason}`;
      studentId = fineRecord.student_id;
    } else if (fee_record_id) {
      recordType = 'fee';
      recordId = fee_record_id;

      // Fetch fee record
      const { data: feeRecord, error: feeError } = await supabaseService
        .from("fee_records")
        .select("id, amount, paid_amount, fee_type, student_id")
        .eq("id", fee_record_id)
        .maybeSingle();
      if (feeError) throw new Error(`Failed to fetch fee record: ${feeError.message}`);
      if (!feeRecord) throw new Error("Fee record not found");

      const amountNum = Number(feeRecord.amount || 0);
      const paidNum = Number(feeRecord.paid_amount || 0);
      const outstanding = Math.max(0, amountNum - paidNum);
      
      if (outstanding <= 0) throw new Error("No outstanding amount to pay");

      amount = outstanding;
      description = `Fee Payment - ${feeRecord.fee_type ?? "Hostel"}`;
      studentId = feeRecord.student_id;
    } else {
      throw new Error("Either fee_record_id or fine_id is required");
    }

    // Validate student ownership
    const { data: student, error: studentError } = await supabaseService
      .from("students")
      .select("id, profile_id, college_id, hostel_id")
      .eq("id", studentId)
      .maybeSingle();
    if (studentError) throw new Error(`Failed to fetch student: ${studentError.message}`);
    if (!student) throw new Error("Student not found");

    if (student.profile_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized to pay this" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
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
              name: description,
            },
            unit_amount: Math.round(amount * 100), // paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-cancel`,
      metadata: {
        user_id: user.id,
        record_type: recordType,
        record_id: recordId,
      },
    });

    // Record payment intent in DB as pending
    await supabaseService.from("payments").insert({
      user_id: user.id,
      fee_record_id: recordType === 'fee' ? recordId : null,
      stripe_session_id: session.id,
      amount: Math.round(amount * 100),
      currency: "inr",
      status: "pending",
    });

    // Update the respective record with session ID
    if (recordType === 'fee') {
      await supabaseService
        .from("fee_records")
        .update({ stripe_session_id: session.id })
        .eq("id", recordId);
    } else {
      await supabaseService
        .from("fines")
        .update({ payment_date: new Date().toISOString() })
        .eq("id", recordId);
    }

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