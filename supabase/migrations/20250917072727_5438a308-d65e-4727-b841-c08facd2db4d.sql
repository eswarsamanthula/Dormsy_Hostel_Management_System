-- Add foreign key constraint between visitors and students tables
ALTER TABLE public.visitors
ADD CONSTRAINT fk_visitors_student_id 
FOREIGN KEY (student_id) REFERENCES public.students(id)
ON DELETE CASCADE;