-- Ensure only one room-attendance record per student per day
CREATE UNIQUE INDEX IF NOT EXISTS uniq_room_attendance_student_date
ON attendance (student_id, date)
WHERE attendance_type = 'room';