-- Add separate link columns for impugnacao and recurso
ALTER TABLE public.audited_opportunities 
ADD COLUMN IF NOT EXISTS impugnacao_link TEXT,
ADD COLUMN IF NOT EXISTS recurso_link TEXT;

-- Migrate existing petition_path data to impugnacao_link
UPDATE public.audited_opportunities 
SET impugnacao_link = petition_path 
WHERE petition_path IS NOT NULL AND impugnacao_link IS NULL;

-- Create function to notify admins when checklist is complete
CREATE OR REPLACE FUNCTION public.notify_checklist_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  opportunity_title TEXT;
  total_items INT;
  completed_items INT;
  user_name TEXT;
BEGIN
  -- Only proceed if item was just marked as completed
  IF NEW.is_completed = true AND (OLD IS NULL OR OLD.is_completed = false) THEN
    -- Get opportunity info
    SELECT ao.title INTO opportunity_title
    FROM opportunity_checklist_items oci
    JOIN audited_opportunities ao ON ao.id = oci.opportunity_id
    WHERE oci.id = NEW.checklist_item_id;
    
    -- Get user name
    SELECT nome INTO user_name
    FROM profiles
    WHERE user_id = NEW.user_id;
    
    -- Count total items for this opportunity
    SELECT COUNT(*) INTO total_items
    FROM opportunity_checklist_items oci
    JOIN opportunity_checklist_items ref ON ref.id = NEW.checklist_item_id
    WHERE oci.opportunity_id = ref.opportunity_id;
    
    -- Count completed items by this user for this opportunity
    SELECT COUNT(*) INTO completed_items
    FROM opportunity_checklist_user_status ocus
    JOIN opportunity_checklist_items oci ON oci.id = ocus.checklist_item_id
    JOIN opportunity_checklist_items ref ON ref.id = NEW.checklist_item_id
    WHERE oci.opportunity_id = ref.opportunity_id
    AND ocus.user_id = NEW.user_id
    AND ocus.is_completed = true;
    
    -- If all items are completed, notify admins
    IF completed_items = total_items AND total_items > 0 THEN
      PERFORM public.notify_admins(
        'opportunity_update',
        'Checklist completo',
        'O usuário ' || COALESCE(user_name, 'Desconhecido') || ' completou todos os documentos do checklist para: ' || COALESCE(opportunity_title, 'Oportunidade'),
        NEW.checklist_item_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for checklist completion notification
DROP TRIGGER IF EXISTS trigger_checklist_complete ON public.opportunity_checklist_user_status;
CREATE TRIGGER trigger_checklist_complete
  AFTER INSERT OR UPDATE ON public.opportunity_checklist_user_status
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_checklist_complete();