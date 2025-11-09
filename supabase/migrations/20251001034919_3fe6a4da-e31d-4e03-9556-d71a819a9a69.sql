-- Fix attendance uniqueness to allow multiple meals per day per student
-- 1) Drop existing too-strict unique constraint
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;

-- 2) Create proper unique indexes
-- Unique per (student, date, meal) for mess attendance
CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_mess
ON public.attendance (student_id, date, meal_type)
WHERE attendance_type = 'mess';

-- Unique per (student, date, attendance_type) for non-mess (e.g., room)
CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_other
ON public.attendance (student_id, date, attendance_type)
WHERE attendance_type IS DISTINCT FROM 'mess';
