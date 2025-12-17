-- Add new enum values to go_no_go_status
ALTER TYPE public.go_no_go_status ADD VALUE IF NOT EXISTS 'Vencida';
ALTER TYPE public.go_no_go_status ADD VALUE IF NOT EXISTS 'Perdida';