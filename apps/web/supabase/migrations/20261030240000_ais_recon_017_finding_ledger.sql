-- AIS-RECON-017 thin slice: tender reconciliation Finding Ledger.
-- Contractor-internal. Never portal/customer. Never auto-mutates estimates.

create table if not exists public.tender_reconciliation_findings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null
    check (kind in (
      'quantity_mismatch',
      'scope_mismatch',
      'missing_scale_or_unit',
      'contradictory_revision',
      'duplicate_evidence',
      'unavailable_source'
    )),
  status text not null default 'needs_review'
    check (status in ('open', 'needs_review', 'accepted', 'rejected', 'superseded')),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null check (char_length(summary) between 1 and 2000),
  expected_quantity numeric,
  observed_quantity numeric,
  unit text check (unit is null or char_length(unit) between 1 and 32),
  source_document_ref text,
  source_revision text,
  estimate_ref text,
  measurement_method text,
  uncertainty text not null default 'unknown'
    check (char_length(uncertainty) between 1 and 32),
  details_json jsonb not null default '{}'::jsonb,
  review_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tender_reconciliation_findings_project_idx
  on public.tender_reconciliation_findings (tenant_id, project_id, created_at desc);

comment on table public.tender_reconciliation_findings is
  'AIS-RECON-017 Finding Ledger; contractor-internal; no estimate auto-mutation; no customer/portal.';

alter table public.tender_reconciliation_findings enable row level security;

revoke all on table public.tender_reconciliation_findings from public, anon;
grant select, insert, update on table public.tender_reconciliation_findings to authenticated;
grant all on table public.tender_reconciliation_findings to service_role;

drop policy if exists tender_reconciliation_findings_select on public.tender_reconciliation_findings;
create policy tender_reconciliation_findings_select on public.tender_reconciliation_findings
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists tender_reconciliation_findings_insert on public.tender_reconciliation_findings;
create policy tender_reconciliation_findings_insert on public.tender_reconciliation_findings
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists tender_reconciliation_findings_update on public.tender_reconciliation_findings;
create policy tender_reconciliation_findings_update on public.tender_reconciliation_findings
  for update using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
