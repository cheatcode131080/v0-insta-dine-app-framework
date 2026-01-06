-- Phase 4: Storage Buckets for QR Codes and Templates
-- Creates Supabase Storage buckets for QR management

-- Create qr-templates bucket (for background templates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-templates', 'qr-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Create qr-codes bucket (for generated QR images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for qr-templates bucket
CREATE POLICY "Admins can upload templates"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'qr-templates'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view templates"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'qr-templates');

CREATE POLICY "Admins can delete templates"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'qr-templates'
    AND auth.role() = 'authenticated'
  );

-- RLS policies for qr-codes bucket
CREATE POLICY "Admins can upload QR codes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'qr-codes'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view QR codes"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'qr-codes');

CREATE POLICY "Admins can delete QR codes"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'qr-codes'
    AND auth.role() = 'authenticated'
  );
