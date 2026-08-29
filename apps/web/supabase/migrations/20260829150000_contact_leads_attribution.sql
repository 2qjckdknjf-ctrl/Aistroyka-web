-- Backward-compatible attribution columns for public contact leads.
-- Do not apply to production from this worktree without an owner gate.

ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS landing_page text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS locale text;
