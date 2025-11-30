-- Fix RLS policies for students table to allow wardens to insert
DROP POLICY IF EXISTS "Students can view student records" ON public.students;

-- Allow wardens to insert student records in their hostel
CREATE POLICY "Wardens can insert students in their hostel" 
ON public.students 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wardens 
    WHERE wardens.profile_id = auth.uid() 
    AND wardens.hostel_id = students.hostel_id
  )
);

-- Allow wardens to view students in their hostel
CREATE POLICY "Wardens can view students in their hostel" 
ON public.students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM wardens 
    WHERE wardens.profile_id = auth.uid() 
    AND wardens.hostel_id = students.hostel_id
  )
);

-- Allow wardens to update students in their hostel
CREATE POLICY "Wardens can update students in their hostel" 
ON public.students 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM wardens 
    WHERE wardens.profile_id = auth.uid() 
    AND wardens.hostel_id = students.hostel_id
  )
);

-- Allow students to view their own record
CREATE POLICY "Students can view their own record" 
ON public.students 
FOR SELECT 
USING (profile_id = auth.uid());