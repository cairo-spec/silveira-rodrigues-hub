-- Add new values to go_no_go_status enum
ALTER TYPE go_no_go_status ADD VALUE IF NOT EXISTS 'Solicitada';
ALTER TYPE go_no_go_status ADD VALUE IF NOT EXISTS 'Rejeitada';

-- Add field to track if report was requested (for showing "Solicitar Parecer" button)
ALTER TABLE audited_opportunities ADD COLUMN IF NOT EXISTS report_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;