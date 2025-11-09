-- Fix critical security issues and enable student access to their own data

-- Enable students to view their own fee records
CREATE POLICY "students_view_own_fee_records" ON public.fee_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = fee_records.student_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to view their own attendance records
CREATE POLICY "students_view_own_attendance" ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = attendance.student_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to view their own complaints
CREATE POLICY "students_view_own_complaints" ON public.complaints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = complaints.student_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to insert their own complaints
CREATE POLICY "students_insert_own_complaints" ON public.complaints
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = complaints.student_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to view their own leave requests
CREATE POLICY "students_view_own_leave_requests" ON public.leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = leave_requests.student_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to insert their own leave requests
CREATE POLICY "students_insert_own_leave_requests" ON public.leave_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = leave_requests.student_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to view mess menu for their hostel
CREATE POLICY "students_view_hostel_mess_menu" ON public.mess_menu
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.hostel_id = mess_menu.hostel_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Enable students to view hostel rules for their hostel
CREATE POLICY "students_view_hostel_rules" ON public.hostel_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.hostel_id = hostel_rules.hostel_id 
      AND s.profile_id = auth.uid()
    )
  );

-- Fix overprivileged payment system - remove overly broad policies
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- Create more secure payment policies (service role only for payments)
CREATE POLICY "service_role_payments_insert" ON public.payments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_payments_update" ON public.payments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix notification creation - restrict to admins and service role only
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Allow only admins and service role to create notifications
CREATE POLICY "admin_service_insert_notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Allow users to view notifications targeted to them or their role
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "users_view_relevant_notifications" ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (
        -- Notifications for everyone (no specific target)
        (notifications.user_id IS NULL) 
        OR 
        -- Notifications for user's role
        (p.role::text = ANY(string_to_array(notifications.category, ',')))
      )
    )
  );