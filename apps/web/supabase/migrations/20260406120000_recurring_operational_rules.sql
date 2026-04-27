-- Wave 4 Step 17 — finite recurring operational rules (not a workflow engine).

create table if not exists public.recurring_operational_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  rule_kind text not null check (rule_kind in (
    'handover_blocked_followup',
    'blocking_defects_followup',
    'stale_discussion_manager',
    'aftercare_open_review'
  )),
  audience text not null default 'manager' check (audience in ('manager')),
  cadence text not null check (cadence in ('daily', 'weekly', 'every_n_days')),
  cadence_days int check (cadence_days is null or cadence_days between 1 and 365),
  active boolean not null default true,
  last_fired_at timestamptz,
  next_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_unique_tenant_kind unique (tenant_id, rule_kind)
);

create index if not exists idx_recurring_rules_tenant_next
  on public.recurring_operational_rules(tenant_id, active, next_due_at);

comment on table public.recurring_operational_rules is
  'Wave 4 Step 17: explicit recurring operational checks per tenant (finite kinds).';

create table if not exists public.recurring_automation_fire_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rule_id uuid not null references public.recurring_operational_rules(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  rule_kind text not null,
  dedupe_key text not null,
  fired_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  constraint recurring_fire_dedupe unique (dedupe_key)
);

create index if not exists idx_recurring_fires_tenant_fired
  on public.recurring_automation_fire_events(tenant_id, fired_at desc);

comment on table public.recurring_automation_fire_events is
  'Audit + idempotency for recurring automation (one row per dedupe_key).';

alter table public.recurring_operational_rules enable row level security;
alter table public.recurring_automation_fire_events enable row level security;

-- Read rules for internal workspace users
create policy recurring_rules_select on public.recurring_operational_rules
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- Toggle active: owner/admin only
create policy recurring_rules_update_admin on public.recurring_operational_rules
  for update using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid() and tm.role in ('owner', 'admin')
    )
  )
  with check (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = auth.uid() and tm.role in ('owner', 'admin')
    )
  );

-- Fire events: read-only for internal (audit visibility)
create policy recurring_fires_select on public.recurring_automation_fire_events
  for select using (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- Inserts/updates from application use service role (cron); no user insert policy
