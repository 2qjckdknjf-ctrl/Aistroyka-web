-- Phase 8 (punch list): optional severity and worker-reported photo references for before/after evidence.
-- Customer-facing surfaces remain non-financial; photos are progress/defect documentation only.

alter table public.project_defects
  add column if not exists severity text
    constraint project_defects_severity_check
    check (severity is null or severity in ('low', 'medium', 'high', 'critical'));

alter table public.project_defects
  add column if not exists photo_before_report_media_id uuid
    references public.worker_report_media(id) on delete set null;

alter table public.project_defects
  add column if not exists photo_after_report_media_id uuid
    references public.worker_report_media(id) on delete set null;

comment on column public.project_defects.severity is
  'Optional defect severity (customer-safe operational label).';

comment on column public.project_defects.photo_before_report_media_id is
  'Optional before photo from worker_report_media (evidence linkage).';

comment on column public.project_defects.photo_after_report_media_id is
  'Optional after / resolution photo from worker_report_media (evidence linkage).';
