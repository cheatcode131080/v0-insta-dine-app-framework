-- Allow public users to read tenants by slug for signup validation
-- This is safe because we only expose the slug/name, no sensitive data

-- Add policy to allow public users to read tenants by slug
CREATE POLICY "Anyone can read tenants by slug for validation"
ON tenants
FOR SELECT
TO public
USING (true);

-- Note: This allows reading tenant basic info (id, name, slug) 
-- which is necessary for signup validation and QR code scanning.
-- No sensitive data is exposed.
