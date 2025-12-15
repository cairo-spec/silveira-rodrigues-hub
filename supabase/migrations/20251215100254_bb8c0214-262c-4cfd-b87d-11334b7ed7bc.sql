-- Add trial_active column to profiles
ALTER TABLE public.profiles 
ADD COLUMN trial_active boolean DEFAULT false;

-- Update RLS policy for kb_articles to include trial users
DROP POLICY IF EXISTS "Users can view published articles based on subscription" ON public.kb_articles;

CREATE POLICY "Users can view published articles based on subscription" 
ON public.kb_articles 
FOR SELECT 
USING (
  (is_published = true) AND (
    (EXISTS ( 
      SELECT 1 FROM kb_categories
      WHERE kb_categories.id = kb_articles.category_id AND kb_categories.is_premium = false
    )) 
    OR (EXISTS ( 
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() AND (profiles.subscription_active = true OR profiles.trial_active = true)
    )) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);