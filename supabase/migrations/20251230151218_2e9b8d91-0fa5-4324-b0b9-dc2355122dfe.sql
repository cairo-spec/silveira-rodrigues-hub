-- Add capabilities field to user_search_criteria table
ALTER TABLE public.user_search_criteria 
ADD COLUMN capabilities text;