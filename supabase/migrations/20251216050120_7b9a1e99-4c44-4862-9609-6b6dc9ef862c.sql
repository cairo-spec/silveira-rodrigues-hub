-- Drop the restrictive admin policy for chat_messages
DROP POLICY IF EXISTS "Admins can manage all chat messages" ON public.chat_messages;

-- Recreate as PERMISSIVE policy (default behavior)
CREATE POLICY "Admins can manage all chat messages"
ON public.chat_messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));