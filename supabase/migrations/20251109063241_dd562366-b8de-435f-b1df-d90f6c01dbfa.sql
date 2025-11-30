-- Add DELETE policy for wardens on students table
CREATE POLICY "Wardens can delete students in their hostel"
ON public.students
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM wardens
    WHERE wardens.profile_id = auth.uid()
    AND wardens.hostel_id = students.hostel_id
  )
);

-- Add UPDATE policy for wardens on profiles table (for students in their hostel)
CREATE POLICY "Wardens can update student profiles in their hostel"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM wardens w
    JOIN students s ON s.hostel_id = w.hostel_id
    WHERE w.profile_id = auth.uid()
    AND s.profile_id = profiles.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM wardens w
    JOIN students s ON s.hostel_id = w.hostel_id
    WHERE w.profile_id = auth.uid()
    AND s.profile_id = profiles.id
  )
);