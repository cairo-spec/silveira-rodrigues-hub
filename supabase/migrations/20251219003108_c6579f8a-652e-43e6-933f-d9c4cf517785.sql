-- Add new ticket status 'under_review' (Em revisão)
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'under_review' AFTER 'in_progress';

-- Add 'estimated_value' currency field to audited_opportunities (up to 10 billion BRL)
ALTER TABLE public.audited_opportunities 
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(15, 2) NULL;

-- Make sure portal_url exists (already added in previous migration)
-- Add column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'audited_opportunities' 
                   AND column_name = 'portal_url') THEN
        ALTER TABLE public.audited_opportunities ADD COLUMN portal_url TEXT NULL;
    END IF;
END $$;