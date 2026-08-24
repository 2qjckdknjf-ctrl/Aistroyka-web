-- Pilot governed AI + visual evidence metadata (staging-compatible additive slice).

create table if not exists public.visual_evidence_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  report_id uuid references public.worker_reports(id) on delete set null,
  task_id uuid references public.worker_tasks(id) on delete set null,
  media_id uuid references public.media(id) on delete set null,
  upload_session_id uuid references public.upload_sessions(id) on delete set null,
  zone_label text,
  floor_label text,
  room_label text,
  source_kind text not null default 'photo'
    check (source_kind in ('photo', 'video', 'panorama_360', 'drone', 'sensor', 'equipment', 'robot')),
  before_after_kind text check (before_after_kind in ('before', 'after', 'unpaired')),
  pair_group_id text,
  issue_id uuid,
  capture_timestamp timestamptz,
  uploader_user_id uuid,
  device_source text,
  internal_only boolean not null default false,
  owner_visible boolean not null default false,
  manager_verified boolean not null default false,
  ai_analysis_status text not null default 'none'
    check (ai_analysis_status in ('none', 'pending', 'complete', 'failed', 'skipped')),
  provenance jsonb not null default '{}'::jsonb,
  checksum text,
  retention_state text not null default 'active'
    check (retention_state in ('active', 'archived', 'pending_delete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visual_evidence_media_ref check (media_id is not null or upload_session_id is not null)
);

create index if not exists idx_visual_evidence_tenant_project
  on public.visual_evidence_records (tenant_id, project_id);
create index if not exists idx_visual_evidence_report
  on public.visual_evidence_records (report_id) where report_id is not null;
create index if not exists idx_visual_evidence_task
  on public.visual_evidence_records (task_id) where task_id is not null;
create index if not exists idx_visual_evidence_media_fk
  on public.visual_evidence_records (media_id) where media_id is not null;
create index if not exists idx_visual_evidence_upload_session_fk
  on public.visual_evidence_records (upload_session_id) where upload_session_id is not null;
create index if not exists idx_visual_evidence_pair_group
  on public.visual_evidence_records (pair_group_id) where pair_group_id is not null;
create unique index if not exists idx_visual_evidence_media_unique
  on public.visual_evidence_records (tenant_id, media_id) where media_id is not null;
create unique index if not exists idx_visual_evidence_session_unique
  on public.visual_evidence_records (tenant_id, upload_session_id) where upload_session_id is not null;

alter table public.visual_evidence_records enable row level security;

create table if not exists public.ai_action_audit_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  initiated_by uuid,
  action_id text not null,
  policy_version text not null default 'pilot-v1',
  source_refs jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  ai_generated boolean not null default true,
  confidence numeric(5, 4),
  dry_run boolean not null default false,
  approved_by uuid,
  executed_at timestamptz not null default now(),
  target_resource_type text,
  target_resource_id text,
  outcome text not null check (outcome in ('success', 'error', 'blocked', 'dry_run')),
  error_category text,
  idempotency_key text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_action_audit_tenant on public.ai_action_audit_records (tenant_id, executed_at desc);
create index if not exists idx_ai_action_audit_action on public.ai_action_audit_records (action_id, executed_at desc);
create index if not exists idx_ai_action_audit_project
  on public.ai_action_audit_records (project_id) where project_id is not null;
create unique index if not exists idx_ai_action_audit_idempotency
  on public.ai_action_audit_records (tenant_id, idempotency_key)
  where idempotency_key is not null;

alter table public.ai_action_audit_records enable row level security;

create table if not exists public.report_completeness_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_id uuid not null references public.worker_reports(id) on delete cascade,
  status text not null check (status in ('complete', 'incomplete', 'needs_manager_review')),
  reasons jsonb not null default '[]'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  rules_version text not null default 'pilot-v1',
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_report_completeness_report
  on public.report_completeness_evaluations (tenant_id, report_id);
create index if not exists idx_report_completeness_report_fk
  on public.report_completeness_evaluations (report_id);

alter table public.report_completeness_evaluations enable row level security;

-- Internal read for tenant members.
create policy visual_evidence_internal_select on public.visual_evidence_records
  for select to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  );

create policy visual_evidence_worker_insert on public.visual_evidence_records
  for insert to authenticated with check (
    owner_visible = false
    and manager_verified = false
    and tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  );

create policy visual_evidence_worker_update on public.visual_evidence_records
  for update to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  ) with check (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager', 'member', 'worker')
    )
  );

create policy visual_evidence_stakeholder_read on public.visual_evidence_records
  for select to authenticated using (
    owner_visible = true
    and internal_only = false
    and retention_state = 'active'
    and tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
    )
    and (
      project_id in (
        select ps.project_id from public.project_stakeholders ps
        where ps.user_id = (select auth.uid()) and ps.status = 'active'
      )
      or project_id in (
        select pm.project_id from public.project_members pm
        where pm.user_id = (select auth.uid()) and pm.role = 'owner'
      )
    )
  );

create policy ai_action_audit_tenant_read on public.ai_action_audit_records
  for select to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'manager')
    )
  );

create policy ai_action_audit_service_role on public.ai_action_audit_records
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy report_completeness_tenant_read on public.report_completeness_evaluations
  for select to authenticated using (
    tenant_id in (
      select tm.tenant_id from public.tenant_members tm
      where tm.user_id = (select auth.uid())
    )
  );

create policy report_completeness_service_role on public.report_completeness_evaluations
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.validate_visual_evidence_project_consistency()
returns trigger
language plpgsql
as $$
declare
  report_project uuid;
begin
  if NEW.report_id is null then
    return NEW;
  end if;

  select wt.project_id into report_project
  from public.worker_reports wr
  left join public.worker_tasks wt
    on wt.id = wr.task_id and wt.tenant_id = wr.tenant_id
  where wr.id = NEW.report_id and wr.tenant_id = NEW.tenant_id;

  if report_project is not null and report_project <> NEW.project_id then
    raise exception 'visual_evidence_records project mismatch for report %', NEW.report_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_visual_evidence_project_consistency on public.visual_evidence_records;
create trigger trg_visual_evidence_project_consistency
  before insert or update on public.visual_evidence_records
  for each row execute function public.validate_visual_evidence_project_consistency();
