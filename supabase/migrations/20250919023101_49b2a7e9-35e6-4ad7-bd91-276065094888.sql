-- Allow wardens to view student profile names/emails for students in their hostel
CREATE POLICY "Wardens can view student profiles in their hostel"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.wardens w
    JOIN public.students s ON s.hostel_id = w.hostel_id
    WHERE w.profile_id = auth.uid()
      AND s.profile_id = profiles.id
  )
);
