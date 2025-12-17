
-- Add client_organization_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS client_organization_id UUID;

-- Create enum for go_no_go status
DO $$ BEGIN
  CREATE TYPE go_no_go_status AS ENUM ('Go', 'No_Go', 'Review_Required');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create audited_opportunities table
CREATE TABLE public.audited_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  opportunity_url TEXT,
  opportunity_abstract VARCHAR(900),
  closing_date DATE NOT NULL,
  client_organization_id UUID NOT NULL,
  agency_name VARCHAR(255) NOT NULL,
  go_no_go go_no_go_status NOT NULL DEFAULT 'Review_Required',
  audit_report_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audited_opportunities ENABLE ROW LEVEL SECURITY;

-- Create index for client_organization_id lookups
CREATE INDEX idx_audited_opportunities_client_org ON public.audited_opportunities(client_organization_id);
CREATE INDEX idx_audited_opportunities_published ON public.audited_opportunities(is_published);

-- RLS Policies for audited_opportunities

-- Admins can manage all opportunities
CREATE POLICY "Admins can manage all opportunities"
ON public.audited_opportunities
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Clients can view published opportunities for their organization
CREATE POLICY "Clients can view their organization opportunities"
ON public.audited_opportunities
FOR SELECT
USING (
  is_published = true 
  AND client_organization_id IN (
    SELECT p.client_organization_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.client_organization_id IS NOT NULL
  )
);

-- Create storage bucket for audit reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audit-reports bucket
CREATE POLICY "Admins can upload audit reports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audit-reports' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update audit reports"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'audit-reports' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete audit reports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audit-reports' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can view audit reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'audit-reports' 
  AND auth.role() = 'authenticated'
);

-- Trigger for updated_at
CREATE TRIGGER update_audited_opportunities_updated_at
BEFORE UPDATE ON public.audited_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
