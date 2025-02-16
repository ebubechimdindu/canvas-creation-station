
-- Create a secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Only allow the service_role to access the secrets table
CREATE POLICY "Service role can manage secrets" ON secrets
  FOR ALL USING (auth.role() = 'service_role');

-- Store the Mapbox token (this will be populated through the secret form)
INSERT INTO secrets (name, value)
VALUES ('MAPBOX_ACCESS_TOKEN', '')
ON CONFLICT (name) DO NOTHING;

-- Update the get_secret function to read from the secrets table
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

