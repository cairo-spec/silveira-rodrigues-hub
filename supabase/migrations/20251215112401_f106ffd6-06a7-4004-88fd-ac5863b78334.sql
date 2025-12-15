-- Add service category to tickets
ALTER TABLE public.tickets 
ADD COLUMN service_category TEXT;

-- Add price columns for display (stored at creation time)
ALTER TABLE public.tickets 
ADD COLUMN service_price TEXT;