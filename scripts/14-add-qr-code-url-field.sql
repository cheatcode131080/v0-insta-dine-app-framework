-- Add qr_code_url field to restaurant_tables
ALTER TABLE restaurant_tables 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add index for qr_code_url lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_qr_code_url ON restaurant_tables(qr_code_url);

COMMENT ON COLUMN restaurant_tables.qr_code_url IS 'Public URL to the generated QR code image in Supabase Storage';
