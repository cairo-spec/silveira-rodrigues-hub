-- Add deny-all policy for processed_webhook_events
-- This table is only accessed by edge functions using service role
-- Service role bypasses RLS, so this blocks all regular user access
CREATE POLICY "Deny all access to webhook events"
ON public.processed_webhook_events
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);