-- Create storage bucket for knowledge base files
INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-files', 'kb-files', true);

-- Add file_url column to kb_articles
ALTER TABLE public.kb_articles ADD COLUMN file_url TEXT;

-- Make content optional (can be null for PDF-only articles)
ALTER TABLE public.kb_articles ALTER COLUMN content DROP NOT NULL;

-- Storage policies for kb-files bucket
CREATE POLICY "Anyone can view kb files"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb-files');

CREATE POLICY "Admins can upload kb files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kb-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update kb files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kb-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete kb files"
ON storage.objects FOR DELETE
USING (bucket_id = 'kb-files' AND has_role(auth.uid(), 'admin'));