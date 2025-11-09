-- Add weekly template support to mess_menu table
-- Add day_of_week field (0-6, where 0=Sunday, 1=Monday, etc.)
ALTER TABLE public.mess_menu ADD COLUMN day_of_week INTEGER;

-- Add is_template field to distinguish between template items and specific date items
ALTER TABLE public.mess_menu ADD COLUMN is_template BOOLEAN DEFAULT false;

-- Update existing data to have is_template=false (existing items are specific dates)
UPDATE public.mess_menu SET is_template = false WHERE is_template IS NULL;

-- Make is_template NOT NULL
ALTER TABLE public.mess_menu ALTER COLUMN is_template SET NOT NULL;

-- Add constraint for day_of_week values (0-6)
ALTER TABLE public.mess_menu ADD CONSTRAINT check_day_of_week 
  CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));

-- Create index for efficient querying of templates
CREATE INDEX idx_mess_menu_template ON public.mess_menu (hostel_id, is_template, day_of_week) 
  WHERE is_template = true;

-- Create index for efficient querying of specific dates
CREATE INDEX idx_mess_menu_date ON public.mess_menu (hostel_id, date) 
  WHERE is_template = false OR is_template IS NULL;