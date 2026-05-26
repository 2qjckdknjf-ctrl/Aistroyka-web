-- Optional narrative from field worker, stored when report is submitted / resubmitted.
alter table public.worker_reports
  add column if not exists worker_note text;

comment on column public.worker_reports.worker_note is 'Worker-provided note at submit/resubmit; optional.';
