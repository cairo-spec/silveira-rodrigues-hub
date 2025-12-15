-- Make kb-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'kb-files';

-- Drop existing storage policies for kb-files if any
DROP POLICY IF EXISTS "Admins can manage kb files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view kb files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view kb files" ON storage.objects;

-- Create storage policies for kb-files bucket
-- Admins can upload/manage files
CREATE POLICY "Admins can manage kb files"
ON storage.objects
FOR ALL
USING (bucket_id = 'kb-files' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'kb-files' AND has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read files (signed URLs will still be required since bucket is private)
CREATE POLICY "Authenticated users can view kb files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'kb-files' AND auth.uid() IS NOT NULL);