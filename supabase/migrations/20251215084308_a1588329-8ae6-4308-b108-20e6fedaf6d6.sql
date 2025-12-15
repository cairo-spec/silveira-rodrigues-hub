-- Create table to track processed webhook events (idempotency)
CREATE TABLE public.processed_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  customer_email TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_processed_webhook_events_event_id ON public.processed_webhook_events(event_id);
CREATE INDEX idx_processed_webhook_events_payment_id ON public.processed_webhook_events(payment_id);

-- Enable RLS
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions only)
-- No public policies needed as this is internal use only