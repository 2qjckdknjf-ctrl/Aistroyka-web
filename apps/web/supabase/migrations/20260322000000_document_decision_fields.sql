-- Owner decision flow: add changes_requested status and decision metadata.
-- pending = under_review only; approved/rejected/changes_requested are decided.

alter table public.project_documents
  drop constraint if exists project_documents_status_check;

alter table public.project_documents
  add constraint project_documents_status_check
  check (status in (
    'draft', 'uploaded', 'under_review',
    'approved', 'rejected', 'changes_requested',
    'archived'
  ));

alter table public.project_documents
  add column if not exists decision_comment text,
  add column if not exists decided_by uuid references auth.users(id) on delete set null;

create index if not exists idx_project_documents_changes_requested
  on public.project_documents(project_id) where status = 'changes_requested';

comment on column public.project_documents.decision_comment is 'Owner decision comment/reason (approve/reject/request_changes)';
comment on column public.project_documents.decided_by is 'User who made the owner decision';
