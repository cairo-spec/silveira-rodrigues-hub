-- 1. Update trigger function: Only impugnacao moves to Participando, recurso keeps the current status
CREATE OR REPLACE FUNCTION public.handle_impugnacao_ticket_resolved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'resolved' or 'closed'
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    -- Check if this ticket is for impugnacao (NOT recurso) and has an opportunity linked
    IF NEW.opportunity_id IS NOT NULL AND NEW.service_category IS NOT NULL THEN
      -- Only impugnacao moves to Participando, recurso does NOT change status
      IF NEW.service_category ILIKE 'impugnacao%' THEN
        UPDATE public.audited_opportunities
        SET go_no_go = 'Participando'
        WHERE id = NEW.opportunity_id;
      END IF;
      -- Recurso tickets do NOT change the opportunity status automatically
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Add contract_url column to audited_opportunities table
ALTER TABLE public.audited_opportunities 
ADD COLUMN IF NOT EXISTS contract_url TEXT;

-- 3. Add confirmed_defeat column to track when user confirms defeat (hides recurso/reverter buttons)
ALTER TABLE public.audited_opportunities 
ADD COLUMN IF NOT EXISTS defeat_confirmed BOOLEAN DEFAULT FALSE;