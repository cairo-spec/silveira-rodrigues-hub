-- Add opportunity_id to tickets table for associating tickets with opportunities
ALTER TABLE public.tickets ADD COLUMN opportunity_id UUID REFERENCES public.audited_opportunities(id) ON DELETE SET NULL;

-- Add index for querying tickets by opportunity
CREATE INDEX idx_tickets_opportunity_id ON public.tickets(opportunity_id);

-- Add portal_url to audited_opportunities for secondary URL when status is Participando
ALTER TABLE public.audited_opportunities ADD COLUMN portal_url TEXT;

-- Notify admins function update: add ability to notify for new account creation
-- (this is handled by the existing trigger, we just need to call it from the handle_new_user function)