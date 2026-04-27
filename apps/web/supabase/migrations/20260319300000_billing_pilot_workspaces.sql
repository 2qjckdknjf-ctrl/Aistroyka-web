-- Billing pilot cohort management (Step 19).
-- Internal ops: add/remove workspaces from pilot without env changes.
-- Env BILLING_PILOT_WORKSPACE_IDS remains fallback; DB overrides when present.

create table if not exists public.billing_pilot_workspaces (
  workspace_id uuid primary key references public.tenants(id) on delete cascade,
  live_checkout_enabled boolean not null default true,
  webhook_processing_enabled boolean not null default true,
  cohort_label text,
  notes text,
  enabled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_pilot_workspaces_workspace
  on public.billing_pilot_workspaces(workspace_id);

comment on table public.billing_pilot_workspaces is 'Billing pilot: internal cohort management. Admin-only. No user self-serve.';

-- RLS: service_role only for writes; admins can select.
alter table public.billing_pilot_workspaces enable row level security;

create policy billing_pilot_workspaces_select on public.billing_pilot_workspaces for select using (
  workspace_id in (select tenant_id from public.tenant_members where user_id = auth.uid() and role in ('owner', 'admin'))
);
create policy billing_pilot_workspaces_all on public.billing_pilot_workspaces for all using (false);
