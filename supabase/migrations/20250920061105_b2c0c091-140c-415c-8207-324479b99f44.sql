-- Update attendance table to support the new comprehensive attendance system
-- Add meal_type and attendance_type fields to support separate room and mess attendance flows

-- First, let's add the new columns to support the enhanced attendance system
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
ADD COLUMN IF NOT EXISTS attendance_type TEXT NOT NULL DEFAULT 'room' CHECK (attendance_type IN ('room', 'mess')),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'skipped')),
ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS self_marked BOOLEAN DEFAULT FALSE;

-- Update the existing constraint to allow multiple records per student per day (one for room, multiple for mess meals)
-- First drop the existing constraint if it exists
DO $$ 
BEGIN
    -- Drop existing unique constraint that might prevent multiple records per day
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_student_id_date_key' 
        AND table_name = 'attendance'
    ) THEN
        ALTER TABLE public.attendance DROP CONSTRAINT attendance_student_id_date_key;
    END IF;
END $$;

-- Create new unique constraint for student, date, attendance_type, and meal_type combination
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_unique_record 
UNIQUE (student_id, date, attendance_type, meal_type);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_type_date ON public.attendance (attendance_type, date);
CREATE INDEX IF NOT EXISTS idx_attendance_meal_type ON public.attendance (meal_type, date);

-- Create a function to auto-generate daily attendance records
CREATE OR REPLACE FUNCTION public.generate_daily_attendance_records(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    student_record RECORD;
    records_created INTEGER := 0;
BEGIN
    -- Generate room attendance records for all students
    FOR student_record IN 
        SELECT s.id as student_id, s.college_id, s.hostel_id
        FROM students s
        WHERE s.hostel_id IS NOT NULL
    LOOP
        -- Insert room attendance record if it doesn't exist
        INSERT INTO public.attendance (
            student_id, 
            date, 
            college_id, 
            hostel_id, 
            attendance_type, 
            status
        )
        VALUES (
            student_record.student_id,
            target_date,
            student_record.college_id,
            student_record.hostel_id,
            'room',
            'absent'
        )
        ON CONFLICT (student_id, date, attendance_type, meal_type) DO NOTHING;

        -- Insert mess attendance records for all meals
        INSERT INTO public.attendance (
            student_id, 
            date, 
            college_id, 
            hostel_id, 
            attendance_type, 
            meal_type,
            status,
            self_marked
        )
        VALUES 
            (student_record.student_id, target_date, student_record.college_id, student_record.hostel_id, 'mess', 'breakfast', 'skipped', true),
            (student_record.student_id, target_date, student_record.college_id, student_record.hostel_id, 'mess', 'lunch', 'skipped', true),
            (student_record.student_id, target_date, student_record.college_id, student_record.hostel_id, 'mess', 'dinner', 'skipped', true)
        ON CONFLICT (student_id, date, attendance_type, meal_type) DO NOTHING;
        
        records_created := records_created + 4; -- 1 room + 3 mess records
    END LOOP;

    RETURN records_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle attendance updates with proper validation
CREATE OR REPLACE FUNCTION public.update_attendance_record(
    p_student_id UUID,
    p_date DATE,
    p_attendance_type TEXT,
    p_meal_type TEXT DEFAULT NULL,
    p_status TEXT,
    p_marked_by UUID DEFAULT NULL,
    p_self_marked BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
    student_info RECORD;
BEGIN
    -- Get student information
    SELECT college_id, hostel_id INTO student_info
    FROM students 
    WHERE id = p_student_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    -- Update or insert attendance record
    INSERT INTO public.attendance (
        student_id,
        date,
        college_id,
        hostel_id,
        attendance_type,
        meal_type,
        status,
        marked_by,
        self_marked
    )
    VALUES (
        p_student_id,
        p_date,
        student_info.college_id,
        student_info.hostel_id,
        p_attendance_type,
        p_meal_type,
        p_status,
        p_marked_by,
        p_self_marked
    )
    ON CONFLICT (student_id, date, attendance_type, meal_type)
    DO UPDATE SET
        status = EXCLUDED.status,
        marked_by = EXCLUDED.marked_by,
        self_marked = EXCLUDED.self_marked,
        updated_at = now();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to handle the new structure
DROP POLICY IF EXISTS "Wardens can view attendance in their hostel" ON public.attendance;
DROP POLICY IF EXISTS "students_view_own_attendance" ON public.attendance;

-- Create new RLS policies
CREATE POLICY "Wardens can manage room attendance in their hostel" ON public.attendance
FOR ALL USING (
    attendance_type = 'room' AND
    EXISTS (
        SELECT 1 FROM wardens 
        WHERE wardens.profile_id = auth.uid() 
        AND wardens.hostel_id = attendance.hostel_id
    )
);

CREATE POLICY "Students can manage their own mess attendance" ON public.attendance
FOR ALL USING (
    attendance_type = 'mess' AND
    EXISTS (
        SELECT 1 FROM students s 
        WHERE s.id = attendance.student_id 
        AND s.profile_id = auth.uid()
    )
);

CREATE POLICY "Students can view their own attendance" ON public.attendance
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM students s 
        WHERE s.id = attendance.student_id 
        AND s.profile_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all attendance" ON public.attendance
FOR SELECT USING (get_current_user_role() = 'admin'::user_role);