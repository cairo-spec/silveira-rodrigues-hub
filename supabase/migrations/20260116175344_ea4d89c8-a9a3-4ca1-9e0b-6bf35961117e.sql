-- Add field for No Go justification text (max 600 chars)
ALTER TABLE public.audited_opportunities 
ADD COLUMN IF NOT EXISTS no_go_justification TEXT;

-- Add a constraint to limit length
ALTER TABLE public.audited_opportunities
ADD CONSTRAINT no_go_justification_length 
CHECK (char_length(no_go_justification) <= 600);