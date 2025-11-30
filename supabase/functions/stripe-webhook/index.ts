import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing stripe-signature header");

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);

    console.log(`[stripe-webhook] Processing event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_id, record_type, record_id } = session.metadata || {};

      console.log(`[stripe-webhook] Payment completed for ${record_type} ${record_id}`);

      // Update payment record
      await supabase
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_intent: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_session_id", session.id);

      // Update the respective record
      if (record_type === "fee") {
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        
        await supabase
          .from("fee_records")
          .update({
            paid_amount: amount,
            paid_date: new Date().toISOString(),
            status: "paid",
            payment_method: "stripe",
            stripe_payment_intent: session.payment_intent as string,
          })
          .eq("id", record_id);

        console.log(`[stripe-webhook] Updated fee record ${record_id}`);
      } else if (record_type === "fine") {
        await supabase
          .from("fines")
          .update({
            status: "paid",
            payment_date: new Date().toISOString(),
          })
          .eq("id", record_id);

        console.log(`[stripe-webhook] Updated fine ${record_id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[stripe-webhook] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
