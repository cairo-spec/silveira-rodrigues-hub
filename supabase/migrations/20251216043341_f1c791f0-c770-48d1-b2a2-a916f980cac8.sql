-- Add version column for optimistic locking
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Create ticket events table for audit timeline
CREATE TABLE IF NOT EXISTS public.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- 'created', 'status_changed', 'comment', 'assigned', 'closed', 'reopened'
  old_value text,
  new_value text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_events
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view events from their own tickets
CREATE POLICY "Users can view events from their tickets"
ON public.ticket_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_events.ticket_id
    AND tickets.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- RLS: System/Admins can insert events
CREATE POLICY "Admins can manage all ticket events"
ON public.ticket_events
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Users can insert events on their own tickets
CREATE POLICY "Users can create events on their tickets"
ON public.ticket_events
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_events.ticket_id
    AND tickets.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON public.ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_created_at ON public.ticket_events(created_at);

-- Enable realtime for ticket_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_events;