-- Create function to update room occupancy
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  -- If room_id changed or student is being inserted
  IF (TG_OP = 'INSERT' AND NEW.room_id IS NOT NULL) THEN
    -- Increment new room occupancy
    UPDATE rooms 
    SET current_occupancy = current_occupancy + 1 
    WHERE id = NEW.room_id;
    
  ELSIF (TG_OP = 'UPDATE' AND OLD.room_id IS DISTINCT FROM NEW.room_id) THEN
    -- Decrement old room occupancy if there was an old room
    IF OLD.room_id IS NOT NULL THEN
      UPDATE rooms 
      SET current_occupancy = GREATEST(current_occupancy - 1, 0)
      WHERE id = OLD.room_id;
    END IF;
    
    -- Increment new room occupancy if there is a new room
    IF NEW.room_id IS NOT NULL THEN
      UPDATE rooms 
      SET current_occupancy = current_occupancy + 1 
      WHERE id = NEW.room_id;
    END IF;
    
  ELSIF (TG_OP = 'DELETE' AND OLD.room_id IS NOT NULL) THEN
    -- Decrement room occupancy when student is deleted
    UPDATE rooms 
    SET current_occupancy = GREATEST(current_occupancy - 1, 0)
    WHERE id = OLD.room_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_room_occupancy ON students;

-- Create trigger for room occupancy updates
CREATE TRIGGER trigger_update_room_occupancy
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_room_occupancy();

-- Fix existing room occupancy counts based on actual student assignments
UPDATE rooms r
SET current_occupancy = (
  SELECT COUNT(*) 
  FROM students s 
  WHERE s.room_id = r.id
);

-- Add comment
COMMENT ON FUNCTION update_room_occupancy() IS 'Automatically maintains room occupancy counts when students are assigned, reassigned, or removed';