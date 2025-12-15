-- Drop existing constraint and recreate pointing to profiles.user_id
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_user_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- Add foreign key from chat_rooms to profiles (using user_id)
ALTER TABLE public.chat_rooms
ADD CONSTRAINT chat_rooms_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from tickets to profiles (using user_id)
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;