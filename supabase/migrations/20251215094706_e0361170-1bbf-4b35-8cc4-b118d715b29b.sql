-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-files', 'ticket-files', false);

-- Add attachment_url column to tickets
ALTER TABLE public.tickets ADD COLUMN attachment_url TEXT;

-- Storage policies for ticket-files bucket
CREATE POLICY "Users can view their own ticket files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own ticket files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all ticket files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-files' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all ticket files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'ticket-files' 
  AND has_role(auth.uid(), 'admin')
);