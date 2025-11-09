-- Add missing columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS attendance_type text,
ADD COLUMN IF NOT EXISTS meal_type text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'absent',
ADD COLUMN IF NOT EXISTS marked_by uuid,
ADD COLUMN IF NOT EXISTS self_marked boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_type_meal ON public.attendance(student_id, date, attendance_type, meal_type);

-- Update existing mess attendance records to have proper status
UPDATE public.attendance 
SET status = CASE 
  WHEN mess_attendance = true THEN 'present'
  WHEN mess_attendance = false THEN 'absent'
  ELSE 'absent'
END,
attendance_type = 'mess'
WHERE mess_attendance IS NOT NULL;