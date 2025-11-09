-- Add RLS policy to allow admins to create fee records
CREATE POLICY "Admins can create fee records" ON public.fee_records
FOR INSERT 
WITH CHECK (get_current_user_role() = 'admin'::user_role);

-- Also allow admins to update fee records 
CREATE POLICY "Admins can update fee records" ON public.fee_records
FOR UPDATE 
USING (get_current_user_role() = 'admin'::user_role);