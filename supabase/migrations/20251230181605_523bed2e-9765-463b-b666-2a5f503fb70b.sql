-- Update the function to set go_no_go to 'Participando' when impugnação OR recurso tickets are resolved
CREATE OR REPLACE FUNCTION public.handle_impugnacao_ticket_resolved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_category text;
BEGIN
  -- Only act when status transitions to resolved
  IF TG_OP = 'UPDATE' AND NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    base_category := replace(coalesce(NEW.service_category, ''), '+upgrade', '');

    -- Check if it's impugnação OR recurso - both mean user is participating
    IF NEW.opportunity_id IS NOT NULL AND (base_category ILIKE 'impugnacao%' OR base_category ILIKE 'recurso%') THEN
      UPDATE public.audited_opportunities
      SET go_no_go = 'Participando',
          updated_at = now()
      WHERE id = NEW.opportunity_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;