-- Add subscription_active field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_active boolean DEFAULT false;

-- Add is_premium field to kb_categories table  
ALTER TABLE public.kb_categories 
ADD COLUMN is_premium boolean DEFAULT false;

-- Update RLS policy for kb_articles to consider premium access
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.kb_articles;

CREATE POLICY "Users can view published articles based on subscription" 
ON public.kb_articles 
FOR SELECT 
USING (
  is_published = true 
  AND (
    -- Article is in a free category
    EXISTS (
      SELECT 1 FROM public.kb_categories 
      WHERE kb_categories.id = kb_articles.category_id 
      AND kb_categories.is_premium = false
    )
    OR
    -- User is a subscriber
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.subscription_active = true
    )
    OR
    -- User is an admin
    has_role(auth.uid(), 'admin'::app_role)
  )
);