-- Create tables that were missing from migrations (created directly in Supabase dashboard)
-- This must run before 20250904005335 (which ALTERS fee_records and REFERENCES fee_records.id)

-- 1. complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. fee_records table
CREATE TABLE IF NOT EXISTS public.fee_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id),
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  fee_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_amount NUMERIC,
  paid_date TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_fee_records_updated_at
  BEFORE UPDATE ON public.fee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id),
  date DATE NOT NULL,
  attendance_type TEXT NOT NULL DEFAULT 'room',
  meal_type TEXT,
  status TEXT NOT NULL DEFAULT 'absent',
  marked_by UUID REFERENCES public.profiles(id),
  self_marked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  room_attendance BOOLEAN,
  mess_attendance BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. hostel_rules table
CREATE TABLE IF NOT EXISTS public.hostel_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.colleges(id),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_rules ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_hostel_rules_updated_at
  BEFORE UPDATE ON public.hostel_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id),
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. mess_menu table
CREATE TABLE IF NOT EXISTS public.mess_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.colleges(id),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id),
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  description TEXT,
  is_vegetarian BOOLEAN,
  date DATE,
  day_of_week INTEGER,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mess_menu ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_mess_menu_updated_at
  BEFORE UPDATE ON public.mess_menu
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
