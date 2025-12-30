-- Add winning bid value column for completed opportunities
ALTER TABLE public.audited_opportunities
ADD COLUMN winning_bid_value NUMERIC(15, 2) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.audited_opportunities.winning_bid_value IS 'Valor do lance vencedor - usado apenas para oportunidades com status Vencida ou Confirmada';