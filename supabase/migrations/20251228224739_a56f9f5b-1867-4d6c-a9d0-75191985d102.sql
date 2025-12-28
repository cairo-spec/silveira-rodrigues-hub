-- Add image_url column to kb_categories table for category illustration
ALTER TABLE public.kb_categories
ADD COLUMN image_url text;