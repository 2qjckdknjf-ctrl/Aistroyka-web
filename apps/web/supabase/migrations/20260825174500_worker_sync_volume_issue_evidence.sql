-- Worker report volume (WIP → Manager/DB) and issue evidence session link.

ALTER TABLE public.worker_reports
  ADD COLUMN IF NOT EXISTS actual_volume numeric,
  ADD COLUMN IF NOT EXISTS planned_volume numeric;

ALTER TABLE public.worker_reports
  DROP CONSTRAINT IF EXISTS worker_reports_actual_volume_range;
ALTER TABLE public.worker_reports
  ADD CONSTRAINT worker_reports_actual_volume_range
  CHECK (actual_volume IS NULL OR (actual_volume >= 0 AND actual_volume <= 1000000));

ALTER TABLE public.worker_reports
  DROP CONSTRAINT IF EXISTS worker_reports_planned_volume_range;
ALTER TABLE public.worker_reports
  ADD CONSTRAINT worker_reports_planned_volume_range
  CHECK (planned_volume IS NULL OR (planned_volume >= 0 AND planned_volume <= 1000000));

ALTER TABLE public.project_issues
  ADD COLUMN IF NOT EXISTS evidence_upload_session_id uuid;

COMMENT ON COLUMN public.worker_reports.actual_volume IS 'Worker-reported actual volume at submit';
COMMENT ON COLUMN public.worker_reports.planned_volume IS 'Planned volume snapshot at submit';
COMMENT ON COLUMN public.project_issues.evidence_upload_session_id IS 'Finalized media upload session for worker result photo';
