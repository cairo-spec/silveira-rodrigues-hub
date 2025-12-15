-- Drop existing restrictive policies for chat_rooms and chat_messages
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages from their chat rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their chat rooms" ON public.chat_messages;

-- New chat_rooms policies
-- Everyone can view lobby rooms
CREATE POLICY "Anyone can view lobby rooms"
ON public.chat_rooms FOR SELECT
USING (room_type = 'lobby');

-- Users can view their own support rooms
CREATE POLICY "Users can view their support rooms"
ON public.chat_rooms FOR SELECT
USING (room_type = 'suporte' AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin')));

-- Users can create chat rooms
CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- New chat_messages policies
-- Anyone can view lobby messages
CREATE POLICY "Anyone can view lobby messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id 
    AND chat_rooms.room_type = 'lobby'
  )
);

-- Users can view support room messages (their own room or admin)
CREATE POLICY "Users can view support messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id 
    AND chat_rooms.room_type = 'suporte'
    AND (chat_rooms.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Users can send messages to lobby or their support room
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id 
    AND (
      chat_rooms.room_type = 'lobby' 
      OR (chat_rooms.room_type = 'suporte' AND chat_rooms.user_id = auth.uid())
    )
  )
);

-- Users can delete their own messages in lobby
CREATE POLICY "Users can delete own lobby messages"
ON public.chat_messages FOR DELETE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id 
    AND chat_rooms.room_type = 'lobby'
  )
);