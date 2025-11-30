-- Allow admins to view all student records
CREATE POLICY "Admins can view all students" 
ON public.students 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all user profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to manage user profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all complaints for system insights
CREATE POLICY "Admins can view all complaints" 
ON public.complaints 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all leave requests for system insights
CREATE POLICY "Admins can view all leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all fee records for system insights
CREATE POLICY "Admins can view all fee records" 
ON public.fee_records 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all attendance records for system insights
CREATE POLICY "Admins can view all attendance" 
ON public.attendance 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all visitor records for system insights
CREATE POLICY "Admins can view all visitors" 
ON public.visitors 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all mess menu items for system management
CREATE POLICY "Admins can view all mess menu" 
ON public.mess_menu 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

-- Allow admins to view all hostel rules for system management
CREATE POLICY "Admins can view all hostel rules" 
ON public.hostel_rules 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);