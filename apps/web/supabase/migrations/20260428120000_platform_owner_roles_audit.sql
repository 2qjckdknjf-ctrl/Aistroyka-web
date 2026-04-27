-- Enterprise hardening: tiered platform owner roles, single row per user, audit log.

-- 1) Consolidate to one row per user (keep highest privilege).
CREATE TEMP TABLE _platform_owner_grants_dedup AS
SELECT DISTINCT ON (user_id)
  user_id,
  role,
  granted_at,
  granted_by
FROM public.platform_owner_grants
ORDER BY user_id,
  CASE role
    WHEN 'OWNER' THEN 1
    WHEN 'OWNER_OPERATOR' THEN 2
    WHEN 'OWNER_READONLY' THEN 3
    ELSE 4
  END,
  granted_at DESC;

DELETE FROM public.platform_owner_grants;

INSERT INTO public.platform_owner_grants (user_id, role, granted_at, granted_by)
SELECT user_id, role, granted_at, granted_by FROM _platform_owner_grants_dedup;

ALTER TABLE public.platform_owner_grants DROP CONSTRAINT IF EXISTS platform_owner_grants_pkey;
ALTER TABLE public.platform_owner_grants DROP CONSTRAINT IF EXISTS platform_owner_grants_role_check;

ALTER TABLE public.platform_owner_grants
  ADD CONSTRAINT platform_owner_grants_role_check
  CHECK (role IN ('OWNER', 'OWNER_READONLY', 'OWNER_OPERATOR'));

ALTER TABLE public.platform_owner_grants ADD PRIMARY KEY (user_id);

COMMENT ON COLUMN public.platform_owner_grants.role IS 'OWNER = full; OWNER_OPERATOR = limited mutations; OWNER_READONLY = read-only.';

-- 2) DB-level audit trail (writes via service role from app only).
CREATE TABLE IF NOT EXISTS public.platform_owner_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip text
);

CREATE INDEX IF NOT EXISTS idx_platform_owner_audit_user_created
  ON public.platform_owner_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_owner_audit_created
  ON public.platform_owner_audit_log (created_at DESC);

COMMENT ON TABLE public.platform_owner_audit_log IS 'Append-only owner cabinet audit; insert from server with service role.';

ALTER TABLE public.platform_owner_audit_log ENABLE ROW LEVEL SECURITY;

-- No policies: authenticated/anon cannot read/write; service role bypasses RLS.
