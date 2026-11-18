-- Additive attribution columns for public contact leads.
-- Safety:
--   - ADD COLUMN IF NOT EXISTS only; no drops, type changes, or rewrites
--   - all columns nullable with no defaults (existing rows stay valid)
--   - existing inserts that omit these fields remain valid
--   - RLS is unchanged (table already RLS-enabled; service-role insert still bypasses)
--   - no new indexes required at this volume; revisit if lead volume grows
-- Rollback / forward-fix:
--   ALTER TABLE public.contact_leads
--     DROP COLUMN IF EXISTS utm_source,
--     DROP COLUMN IF EXISTS utm_medium,
--     DROP COLUMN IF EXISTS utm_campaign,
--     DROP COLUMN IF EXISTS utm_content,
--     DROP COLUMN IF EXISTS utm_term,
--     DROP COLUMN IF EXISTS landing_page,
--     DROP COLUMN IF EXISTS referrer,
--     DROP COLUMN IF EXISTS locale;
-- Apply only through the repository staging → production migration path.
-- Do not apply to production from a worktree.

ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS landing_page text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE contact_leads ADD COLUMN IF NOT EXISTS locale text;
