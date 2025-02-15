
-- Drop the existing function first
DROP FUNCTION IF EXISTS get_secret;

-- Create the updated function that reads from the secrets table
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

  RETURN (SELECT value FROM secrets WHERE secrets.name = get_secret.name);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
