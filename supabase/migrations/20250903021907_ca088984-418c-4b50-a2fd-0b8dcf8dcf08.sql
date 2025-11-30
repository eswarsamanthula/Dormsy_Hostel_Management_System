-- Create visitors table for visitor management
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT NOT NULL,
  visitor_id_proof TEXT NOT NULL,
  relationship TEXT NOT NULL,
  visit_purpose TEXT,
  visit_date DATE NOT NULL,
  visit_time_from TIME NOT NULL,
  visit_time_to TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  college_id UUID NOT NULL,
  hostel_id UUID NOT NULL
);

-- Create audit_logs table for tracking system actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  college_id UUID,
  hostel_id UUID
);

-- Create notifications table for push notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category TEXT NOT NULL CHECK (category IN ('complaint', 'leave', 'fee', 'visitor', 'attendance', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  college_id UUID,
  hostel_id UUID
);

-- Create qr_codes table for managing QR code data
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('student_id', 'visitor_pass', 'entry_exit')),
  code_data TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  college_id UUID NOT NULL,
  hostel_id UUID
);

-- Enable RLS on all new tables
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for visitors
CREATE POLICY "Students can manage their own visitor requests" 
ON public.visitors 
FOR ALL
USING (student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()));

CREATE POLICY "Wardens can manage visitors in their hostel" 
ON public.visitors 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM wardens 
  WHERE wardens.profile_id = auth.uid() AND wardens.hostel_id = visitors.hostel_id
));

-- Create RLS policies for audit_logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT
USING (user_id = auth.uid());

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT
WITH CHECK (true);

-- Create RLS policies for qr_codes
CREATE POLICY "Users can view their own QR codes" 
ON public.qr_codes 
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Students can create their own QR codes" 
ON public.qr_codes 
FOR INSERT
WITH CHECK (user_id = auth.uid() AND get_current_user_role() = 'student'::user_role);

CREATE POLICY "Wardens can view QR codes in their hostel" 
ON public.qr_codes 
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM wardens 
  WHERE wardens.profile_id = auth.uid() AND wardens.hostel_id = qr_codes.hostel_id
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON public.visitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
BEFORE UPDATE ON public.qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for automatic audit logging
CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for authenticated users
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;