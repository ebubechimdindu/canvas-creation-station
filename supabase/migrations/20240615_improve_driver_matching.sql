
-- Function to find nearby drivers with improved randomization when multiple drivers have similar distances
CREATE OR REPLACE FUNCTION public.find_nearby_drivers(pickup_point geography, max_distance_meters double precision DEFAULT 5000, max_results integer DEFAULT 10)
RETURNS TABLE(
    driver_id text, 
    full_name text, 
    phone_number text, 
    profile_picture_url text, 
    status text, 
    distance double precision, 
    current_location geography, 
    last_updated timestamp without time zone, 
    rating double precision
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH driver_distances AS (
        SELECT 
            dp.id,
            dp.full_name,
            dp.phone_number,
            dp.profile_picture_url,
            dp.status as driver_status,
            dl.location::geography as driver_location,
            dl.updated_at as last_location_update,
            -- Calculate distance using PostGIS
            ST_Distance(dl.location::geography, pickup_point) as distance_meters,
            COALESCE(
                (SELECT AVG(CAST(rating AS float))::float 
                FROM ride_ratings 
                WHERE driver_id = dp.id),
                4.5 -- Default rating for new drivers
            ) as driver_rating,
            -- Add random value for tie-breaking
            random() as random_value
        FROM driver_profiles dp
        JOIN driver_locations dl ON dp.id = dl.driver_id
        WHERE 
            dl.is_active = true 
            AND dl.is_online = true
            -- Exclude drivers who are currently assigned to a ride
            AND NOT EXISTS (
                SELECT 1 
                FROM ride_requests rr 
                WHERE 
                    rr.driver_id = dp.id 
                    AND rr.status IN ('driver_assigned', 'en_route_to_pickup', 'arrived_at_pickup', 'in_progress')
            )
            -- Only include verified drivers
            AND dp.status = 'verified'
            -- Ensure location update is recent (within last 5 minutes)
            AND dl.updated_at > NOW() - INTERVAL '5 minutes'
    )
    SELECT 
        dd.id,
        dd.full_name,
        dd.phone_number,
        dd.profile_picture_url,
        dd.driver_status,
        dd.distance_meters,
        dd.driver_location,
        dd.last_location_update,
        dd.driver_rating
    FROM driver_distances dd
    WHERE dd.distance_meters <= max_distance_meters
    -- Use distance first, then random value for tie-breaking
    ORDER BY dd.distance_meters ASC, dd.random_value ASC
    LIMIT max_results;
END;
$$;

-- Function to match ride request with the nearest driver, with improved randomization
CREATE OR REPLACE FUNCTION public.match_ride_request(request_id integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  matched_driver TEXT;
  match_distance FLOAT;
BEGIN
  -- Add randomization by using ORDER BY random() when distances are similar
  SELECT driver_id, distance 
  INTO matched_driver, match_distance
  FROM find_nearby_drivers(
    (SELECT pickup_location FROM ride_requests WHERE id = request_id),
    5000, -- max distance in meters
    1     -- limit to 1 result
  );
  
  IF matched_driver IS NOT NULL AND match_distance <= 5000 THEN
    UPDATE ride_requests 
    SET 
      status = 'driver_assigned',
      driver_id = matched_driver,
      matched_at = NOW()
    WHERE id = request_id;
    RETURN TRUE;
  END IF;
  
  UPDATE ride_requests 
  SET 
    status = 'timeout',
    timeout_at = NOW()
  WHERE id = request_id;
  RETURN FALSE;
END;
$$;
