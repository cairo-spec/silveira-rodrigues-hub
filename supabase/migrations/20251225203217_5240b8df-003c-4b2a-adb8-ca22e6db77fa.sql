-- Add minimum_value column to user_search_criteria table
ALTER TABLE public.user_search_criteria
ADD COLUMN minimum_value NUMERIC(15, 2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_search_criteria.minimum_value IS 'Valor mínimo de oportunidade em reais';