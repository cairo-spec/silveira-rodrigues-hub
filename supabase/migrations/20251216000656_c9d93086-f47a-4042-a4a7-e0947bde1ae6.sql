-- Fix: Remove insecure INSERT policy that allows any authenticated user to insert notifications for anyone
-- This forces all notification inserts to go through SECURITY DEFINER functions like notify_admins()
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;