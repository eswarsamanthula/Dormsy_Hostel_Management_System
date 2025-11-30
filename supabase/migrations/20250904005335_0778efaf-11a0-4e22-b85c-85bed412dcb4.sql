-- Add Stripe payment tracking to fee_records
ALTER TABLE public.fee_records 
ADD COLUMN stripe_session_id TEXT,
ADD COLUMN stripe_payment_intent TEXT;

-- Create payments table to track Stripe transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fee_record_id UUID REFERENCES public.fee_records(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT,
  amount INTEGER NOT NULL, -- Amount in paise (INR cents)
  currency TEXT NOT NULL DEFAULT 'inr',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Students can view their own payments
CREATE POLICY "Students can view their own payments" ON public.payments
FOR SELECT
USING (user_id = auth.uid());

-- Allow system to insert payments (for edge functions)
CREATE POLICY "System can insert payments" ON public.payments
FOR INSERT
WITH CHECK (true);

-- Allow system to update payments (for edge functions)  
CREATE POLICY "System can update payments" ON public.payments
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_stripe_session_id ON public.payments(stripe_session_id);
CREATE INDEX idx_fee_records_stripe_session_id ON public.fee_records(stripe_session_id);