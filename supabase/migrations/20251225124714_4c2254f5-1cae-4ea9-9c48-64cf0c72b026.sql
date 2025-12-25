-- Create table for user search criteria
CREATE TABLE public.user_search_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  states TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_search_criteria ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own criteria
CREATE POLICY "Users can view their own criteria"
ON public.user_search_criteria
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own criteria"
ON public.user_search_criteria
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own criteria"
ON public.user_search_criteria
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all criteria
CREATE POLICY "Admins can view all criteria"
ON public.user_search_criteria
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_search_criteria_updated_at
BEFORE UPDATE ON public.user_search_criteria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();