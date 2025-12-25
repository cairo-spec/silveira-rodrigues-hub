-- Add company_presentation column to user_search_criteria
ALTER TABLE public.user_search_criteria 
ADD COLUMN company_presentation TEXT;