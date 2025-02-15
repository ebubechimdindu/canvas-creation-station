
CREATE OR REPLACE FUNCTION get_secret(name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow specific secret names
  IF name NOT IN ('MAPBOX_ACCESS_TOKEN') THEN
    RETURN NULL;
  END IF;

  RETURN current_setting('app.settings.' || name);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
