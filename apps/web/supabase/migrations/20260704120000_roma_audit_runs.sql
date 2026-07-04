-- ROMA Safe Readonly Audit run history (append-only, platform-owner via service role).

CREATE TABLE IF NOT EXISTS public.roma_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by_email_hash text,
  mode text NOT NULL CHECK (mode = 'SAFE_READONLY_AUDIT'),
  status text NOT NULL CHECK (status IN ('pass', 'degraded', 'fail', 'unknown')),
  release_recommendation text NOT NULL,
  confidence text NOT NULL,
  coverage_percent numeric,
  critical_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  evidence_summary jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  findings_summary jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  recommendations_summary jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_version text NOT NULL,
  build_sha text,
  environment text NOT NULL,
  raw_payload_redacted jsonb NOT NULL,
  retention_until timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roma_audit_runs_created_at
  ON public.roma_audit_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_roma_audit_runs_status_created
  ON public.roma_audit_runs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_roma_audit_runs_retention_until
  ON public.roma_audit_runs (retention_until);

COMMENT ON TABLE public.roma_audit_runs IS
  'Append-only ROMA safe readonly audit snapshots; read/write via service role from platform-owner API only.';

ALTER TABLE public.roma_audit_runs ENABLE ROW LEVEL SECURITY;

-- No policies: authenticated/anon denied; service role bypasses RLS for server inserts/selects.
