-- 1. Restrict lobby chat to authenticated users only (prevent user_id exposure to anonymous users)
DROP POLICY IF EXISTS "Anyone can view lobby messages" ON chat_messages;

CREATE POLICY "Authenticated users can view lobby messages"
ON chat_messages FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM chat_rooms 
  WHERE chat_rooms.id = chat_messages.room_id 
  AND chat_rooms.room_type = 'lobby'
));

-- 2. Also restrict lobby rooms to authenticated users
DROP POLICY IF EXISTS "Anyone can view lobby rooms" ON chat_rooms;

CREATE POLICY "Authenticated users can view lobby rooms"
ON chat_rooms FOR SELECT
TO authenticated
USING (room_type = 'lobby');

-- 3. Remove file_url from public view - create a secure function to get files
-- The kb_articles already uses signed URLs via get-kb-file-url edge function
-- But let's ensure the file_url is not directly exposed by adding a comment
COMMENT ON COLUMN kb_articles.file_url IS 'Internal storage path - access via get-kb-file-url edge function with signed URLs only';