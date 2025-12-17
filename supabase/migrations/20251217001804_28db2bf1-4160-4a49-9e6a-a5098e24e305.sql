
-- Create organizations table (for human-readable organization names)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
CREATE POLICY "Admins can manage organizations"
ON public.organizations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.client_organization_id = organizations.id
  )
);

-- Backfill organizations from existing profiles.client_organization_id
INSERT INTO public.organizations (id, name)
SELECT
  p.client_organization_id,
  COALESCE(NULLIF(p.empresa, ''), 'Organização ' || left(p.client_organization_id::text, 8))
FROM public.profiles p
WHERE p.client_organization_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Add FKs after backfill (safe)
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_client_organization_id_fkey
    FOREIGN KEY (client_organization_id)
    REFERENCES public.organizations(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audited_opportunities
    ADD CONSTRAINT audited_opportunities_client_organization_id_fkey
    FOREIGN KEY (client_organization_id)
    REFERENCES public.organizations(id)
    ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
