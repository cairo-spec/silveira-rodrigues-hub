-- Allow clients to update their organization's opportunities (for status changes like Solicitada/Rejeitada)
CREATE POLICY "Clients can update their organization opportunities" 
ON public.audited_opportunities 
FOR UPDATE 
USING (
  is_published = true 
  AND client_organization_id IN (
    SELECT p.client_organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid() AND p.client_organization_id IS NOT NULL
  )
)
WITH CHECK (
  is_published = true 
  AND client_organization_id IN (
    SELECT p.client_organization_id
    FROM profiles p
    WHERE p.user_id = auth.uid() AND p.client_organization_id IS NOT NULL
  )
);