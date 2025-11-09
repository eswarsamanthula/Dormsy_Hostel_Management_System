-- Allow students to INSERT and UPDATE their own mess attendance records
-- This resolves client errors when marking mess attendance due to missing RLS permissions

-- INSERT policy for students (only for attendance_type = 'mess')
CREATE POLICY "students_insert_own_mess_attendance"
ON public.attendance
FOR INSERT
WITH CHECK (
  attendance_type = 'mess'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendance.student_id
      AND s.profile_id = auth.uid()
  )
);

-- UPDATE policy for students (only for attendance_type = 'mess')
CREATE POLICY "students_update_own_mess_attendance"
ON public.attendance
FOR UPDATE
USING (
  attendance_type = 'mess'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendance.student_id
      AND s.profile_id = auth.uid()
  )
)
WITH CHECK (
  attendance_type = 'mess'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = attendance.student_id
      AND s.profile_id = auth.uid()
  )
);
