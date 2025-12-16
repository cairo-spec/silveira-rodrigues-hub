-- Enable REPLICA IDENTITY FULL for chat_messages to capture row data on DELETE events
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;