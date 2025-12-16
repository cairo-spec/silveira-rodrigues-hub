-- Add UPDATE policy for users to update their own lobby messages (for soft delete)
CREATE POLICY "Users can update own lobby messages" ON public.chat_messages
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = chat_messages.room_id 
      AND chat_rooms.room_type = 'lobby'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE chat_rooms.id = chat_messages.room_id 
      AND chat_rooms.room_type = 'lobby'
    )
  );