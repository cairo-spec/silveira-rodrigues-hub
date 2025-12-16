-- Add is_archived column to tickets table
ALTER TABLE public.tickets ADD COLUMN is_archived boolean NOT NULL DEFAULT false;