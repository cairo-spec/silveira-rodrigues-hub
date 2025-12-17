-- Add petition_path column for storing petition documents
ALTER TABLE public.audited_opportunities 
ADD COLUMN petition_path text;