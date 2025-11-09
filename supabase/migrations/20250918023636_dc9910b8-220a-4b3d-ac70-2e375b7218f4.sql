-- Create fines table for managing student fines
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  college_id UUID NOT NULL,
  hostel_id UUID NOT NULL,
  fine_reason TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Create policies for fines
CREATE POLICY "Admins can view all fines" 
ON public.fines 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Wardens can manage fines in their hostel" 
ON public.fines 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM wardens 
  WHERE wardens.profile_id = auth.uid() 
  AND wardens.hostel_id = fines.hostel_id
));

CREATE POLICY "Students can view their own fines" 
ON public.fines 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM students s 
  WHERE s.id = fines.student_id 
  AND s.profile_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fines_updated_at
BEFORE UPDATE ON public.fines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();