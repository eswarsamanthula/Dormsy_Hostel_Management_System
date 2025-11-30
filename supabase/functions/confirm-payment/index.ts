import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    // Decode JWT locally
    type JwtPayload = { sub?: string };
    let uid = "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
      uid = payload.sub ?? "";
    } catch {
      throw new Error("Invalid JWT token");
    }
    if (!uid) throw new Error("User not authenticated (no sub in JWT)");

    // Clients
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    // Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    const { session_id } = await req.json().catch(() => ({}));
    if (!session_id) throw new Error("session_id is required");

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) throw new Error("Session not found in Stripe");

    const recordType = session.metadata?.record_type as 'fee' | 'fine' | undefined;
    const recordId = session.metadata?.record_id as string | undefined;
    const userId = session.metadata?.user_id as string | undefined;

    if (!recordType || !recordId) throw new Error("Missing record metadata on session");
    if (userId && userId !== uid) {
      return new Response(JSON.stringify({ error: "Not authorized for this session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Ownership validation from DB
    if (recordType === 'fee') {
      const { data: fee } = await supabaseService
        .from('fee_records')
        .select('id, student_id, status')
        .eq('id', recordId)
        .maybeSingle();
      if (!fee) throw new Error('Fee record not found');
      const { data: student } = await supabaseService
        .from('students')
        .select('profile_id')
        .eq('id', fee.student_id)
        .maybeSingle();
      if (!student || student.profile_id !== uid) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    } else if (recordType === 'fine') {
      const { data: fine } = await supabaseService
        .from('fines')
        .select('id, student_id')
        .eq('id', recordId)
        .maybeSingle();
      if (!fine) throw new Error('Fine not found');
      const { data: student } = await supabaseService
        .from('students')
        .select('profile_id')
        .eq('id', fine.student_id)
        .maybeSingle();
      if (!student || student.profile_id !== uid) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    // Only proceed if paid/completed
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    if (!paid) {
      return new Response(JSON.stringify({ updated: false, reason: 'not_paid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Upsert payment row and update records
    const amount = session.amount_total ? Math.round(session.amount_total) : null; // paise

    await supabaseService
      .from('payments')
      .update({
        status: 'succeeded',
        stripe_payment_intent: (session.payment_intent as string) ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', session.id);

    if (recordType === 'fee') {
      // Paid amount in rupees
      const rupees = amount ? amount / 100 : null;
      await supabaseService
        .from('fee_records')
        .update({
          status: 'paid',
          paid_amount: rupees,
          paid_date: new Date().toISOString(),
          payment_method: 'stripe',
          stripe_payment_intent: (session.payment_intent as string) ?? null,
          stripe_session_id: session.id,
        })
        .eq('id', recordId);
    } else {
      await supabaseService
        .from('fines')
        .update({ status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', recordId);
    }

    return new Response(JSON.stringify({ updated: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[confirm-payment] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
