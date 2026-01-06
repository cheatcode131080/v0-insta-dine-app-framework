-- Create Supabase Storage bucket for menu item images
-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-images bucket
-- Allow authenticated users to view images
CREATE POLICY "Public can view menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Only admins/managers can upload images to their tenant folder
CREATE POLICY "Admins can upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'tenant'
  );

-- Only admins/managers can update images in their tenant folder
CREATE POLICY "Admins can update menu images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
  );

-- Only admins/managers can delete images in their tenant folder
CREATE POLICY "Admins can delete menu images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
  );
