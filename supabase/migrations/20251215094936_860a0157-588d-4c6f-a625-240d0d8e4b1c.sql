-- Add room_type column to chat_rooms
ALTER TABLE public.chat_rooms ADD COLUMN room_type TEXT NOT NULL DEFAULT 'lobby';

-- Add index for room_type queries
CREATE INDEX idx_chat_rooms_room_type ON public.chat_rooms(room_type);