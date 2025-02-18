
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS calculate_driver_active_hours;

-- Create new function with correct column references
CREATE OR REPLACE FUNCTION calculate_driver_active_hours(
  driver_id UUID,
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE
)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  total_hours FLOAT;
BEGIN
  SELECT 
    COALESCE(
      EXTRACT(
        EPOCH FROM SUM(
          LEAST(updated_at, date_end) - 
          GREATEST(last_updated, date_start)
        )
      ) / 3600.0,
      0
    )
  INTO total_hours
  FROM driver_locations
  WHERE 
    driver_locations.driver_id = calculate_driver_active_hours.driver_id
    AND is_active = true
    AND last_updated >= date_start
    AND updated_at <= date_end;

  RETURN total_hours;
END;
$$;

