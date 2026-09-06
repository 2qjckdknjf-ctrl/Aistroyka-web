-- RELEASE HARDENING SECURITY WAVE 11
-- Schema-drift bootstrap for aftercare tables.
--
-- Production reconciliation on 2026-09-06 found that the historical migration
-- 20260405120000_project_aftercare_service_requests.sql is absent from the live
-- migration ledger and the two aftercare tables are also absent. The later
-- hardening migration 20260906114000 references these tables directly.
--
-- This forward migration is intentionally fail-closed:
--   * creates only missing tables/indexes;
--   * enables RLS;
--   * creates read policies only when absent;
--   * does NOT recreate the historical broad internal write policy;
--   * does NOT create the portal INSERT policy here. The final strict portal
--     policy is created by 20260906125500 after 114000 hardening has run.

create table if not exists public.project_service_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'reported' check (status in (
    'reported',
    'triaged',
    'in_progress',
    'resolved',
    'closed'
  )),
  coverage_type text not null default 'warranty_review_needed' check (coverage_type in (
    'warranty_covered',
    'warranty_review_needed',
    'not_warranty'
  )),
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  linked_handover_id uuid references public.project_handover(id) on delete set null,
  linked_defect_id uuid references public.project_defects(id) on delete set null,
  linked_discussion_id uuid references public.project_stakeholder_discussions(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_service_requests_project
  on public.project_service_requests(tenant_id, project_id, updated_at desc);

comment on table public.project_service_requests is
  'Post-handover warranty/aftercare requests; forward-bootstrap compatible with historical Wave 4 schema.';

create table if not exists public.project_service_request_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  service_request_id uuid not null references public.project_service_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_service_request_events_req
  on public.project_service_request_events(service_request_id, created_at asc);

alter table public.project_service_requests enable row level security;
alter table public.project_service_request_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_service_requests'
      and policyname = 'project_service_requests_select'
  ) then
    execute $policy$
      create policy project_service_requests_select
        on public.project_service_requests
        for select
        to authenticated
        using (
          public.project_belongs_to_tenant(project_id, tenant_id)
          and (
            public.is_internal_tenant_reader_for_tenant(tenant_id)
            or public.is_portal_stakeholder_for_project(project_id)
          )
        )
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_service_request_events'
      and policyname = 'project_service_request_events_select'
  ) then
    execute $policy$
      create policy project_service_request_events_select
        on public.project_service_request_events
        for select
        to authenticated
        using (
          public.project_belongs_to_tenant(project_id, tenant_id)
          and exists (
            select 1
            from public.project_service_requests sr
            where sr.id = service_request_id
              and sr.tenant_id = project_service_request_events.tenant_id
              and sr.project_id = project_service_request_events.project_id
          )
          and (
            public.is_internal_tenant_reader_for_tenant(tenant_id)
            or public.is_portal_stakeholder_for_project(project_id)
          )
        )
    $policy$;
  end if;
end
$$;
