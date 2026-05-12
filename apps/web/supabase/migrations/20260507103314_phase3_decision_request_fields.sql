-- Phase 3: canonical decision request fields on existing auditable client request table.
--
-- project_client_requests is the shipped decision-request workflow in this repo.
-- These columns add the roadmap Phase 3 semantics without duplicating state.

alter table public.project_client_requests
  add column if not exists decision_type text check (
    decision_type is null or decision_type in (
      'design_choice',
      'material_choice',
      'estimate_approval',
      'cost_change_customer_facing',
      'schedule_change',
      'document_approval',
      'work_acceptance',
      'general_question',
      'other'
    )
  ),
  add column if not exists priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists due_at timestamptz,
  add column if not exists decided_at timestamptz,
  add column if not exists decision_note text,
  add column if not exists customer_visible_amount numeric(14,2) check (customer_visible_amount is null or customer_visible_amount >= 0),
  add column if not exists customer_visible_currency text;

alter table public.project_client_requests
  add constraint project_client_requests_customer_amount_type
  check (
    customer_visible_amount is null
    or decision_type in ('estimate_approval', 'cost_change_customer_facing')
  ) not valid;

create index if not exists idx_project_client_requests_due
  on public.project_client_requests(project_id, status, due_at)
  where due_at is not null;

comment on column public.project_client_requests.decision_type is
  'Phase 3 canonical decision request type. Existing kind/action_mode controls response mechanics.';

comment on column public.project_client_requests.customer_visible_amount is
  'Customer-facing amount only for estimate_approval or cost_change_customer_facing; never internal actual cost.';
