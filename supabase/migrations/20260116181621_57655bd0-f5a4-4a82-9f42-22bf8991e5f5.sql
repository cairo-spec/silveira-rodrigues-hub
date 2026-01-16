-- Create opportunity_checklist_items table for admin to define required documents
CREATE TABLE public.opportunity_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.audited_opportunities(id) ON DELETE CASCADE NOT NULL,
  document_name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_checklist_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage all checklist items
CREATE POLICY "Admins can manage checklist items"
ON public.opportunity_checklist_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view checklist items for their organization's opportunities
CREATE POLICY "Users can view checklist items for their opportunities"
ON public.opportunity_checklist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM audited_opportunities ao
    JOIN profiles p ON p.client_organization_id = ao.client_organization_id
    WHERE ao.id = opportunity_checklist_items.opportunity_id
    AND ao.is_published = true
    AND p.user_id = auth.uid()
  )
);

-- Create opportunity_checklist_user_status table for user to tick items
CREATE TABLE public.opportunity_checklist_user_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID REFERENCES public.opportunity_checklist_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(checklist_item_id, user_id)
);

ALTER TABLE public.opportunity_checklist_user_status ENABLE ROW LEVEL SECURITY;

-- Users can manage their own checklist status
CREATE POLICY "Users can manage their own checklist status"
ON public.opportunity_checklist_user_status
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all checklist status
CREATE POLICY "Admins can view all checklist status"
ON public.opportunity_checklist_user_status
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add opportunity_id column to chat_rooms for opportunity-specific chats
ALTER TABLE public.chat_rooms ADD COLUMN opportunity_id UUID REFERENCES public.audited_opportunities(id) ON DELETE CASCADE;

-- Add index for opportunity_id queries
CREATE INDEX idx_chat_rooms_opportunity_id ON public.chat_rooms(opportunity_id);

-- Update RLS policies for chat_rooms to allow opportunity chats
-- Users can view chat rooms for opportunities in their organization
CREATE POLICY "Users can view opportunity chat rooms"
ON public.chat_rooms
FOR SELECT
USING (
  room_type = 'opportunity' AND
  EXISTS (
    SELECT 1 FROM audited_opportunities ao
    JOIN profiles p ON p.client_organization_id = ao.client_organization_id
    WHERE ao.id = chat_rooms.opportunity_id
    AND p.user_id = auth.uid()
  )
);

-- Users can create opportunity chat rooms
CREATE POLICY "Users can create opportunity chat rooms"
ON public.chat_rooms
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  room_type = 'opportunity' AND
  EXISTS (
    SELECT 1 FROM audited_opportunities ao
    JOIN profiles p ON p.client_organization_id = ao.client_organization_id
    WHERE ao.id = chat_rooms.opportunity_id
    AND p.user_id = auth.uid()
  )
);

-- Update chat_messages RLS to allow opportunity chat messages
CREATE POLICY "Users can view opportunity chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN audited_opportunities ao ON ao.id = cr.opportunity_id
    JOIN profiles p ON p.client_organization_id = ao.client_organization_id
    WHERE cr.id = chat_messages.room_id
    AND cr.room_type = 'opportunity'
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send opportunity chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN audited_opportunities ao ON ao.id = cr.opportunity_id
    JOIN profiles p ON p.client_organization_id = ao.client_organization_id
    WHERE cr.id = chat_messages.room_id
    AND cr.room_type = 'opportunity'
    AND p.user_id = auth.uid()
  )
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunity_checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunity_checklist_user_status;