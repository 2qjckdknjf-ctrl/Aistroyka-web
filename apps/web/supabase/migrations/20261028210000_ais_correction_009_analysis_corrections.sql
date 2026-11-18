-- AIS-CORRECTION-009: versioned original prediction + correction provenance.
-- Append-only correction rows. Contractor-internal. Never portal/customer-facing.

alter table public.ai_analysis
  drop constraint if exists ai_analysis_review_status_check;

alter table public.ai_analysis
  add constraint ai_analysis_review_status_check
  check (review_status = any (array[
    'pending'::text,
    'accepted'::text,
    'edited'::text,
    'rejected'::text,
    'insufficient_evidence'::text
  ]));

create table if not exists public.ai_analysis_corrections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  analysis_id uuid not null references public.ai_analysis (id) on delete cascade,
  verdict text not null check (verdict in ('accepted', 'edited', 'rejected', 'insufficient_evidence')),
  original_snapshot jsonb not null,
  corrected_payload jsonb,
  reason text,
  reviewer_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists ai_analysis_corrections_analysis_idx
  on public.ai_analysis_corrections (tenant_id, analysis_id, created_at desc);

comment on table public.ai_analysis_corrections is
  'AIS-CORRECTION-009 append-only human correction provenance for durable AI predictions.';

alter table public.ai_analysis_corrections enable row level security;

revoke all on table public.ai_analysis_corrections from public, anon;
grant select, insert on table public.ai_analysis_corrections to authenticated;
grant all on table public.ai_analysis_corrections to service_role;

drop policy if exists ai_analysis_corrections_select on public.ai_analysis_corrections;
create policy ai_analysis_corrections_select on public.ai_analysis_corrections
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists ai_analysis_corrections_insert on public.ai_analysis_corrections;
create policy ai_analysis_corrections_insert on public.ai_analysis_corrections
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
