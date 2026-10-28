-- AIS-MATERIAL-008 follow-up: immutable draft comparison revisions.
-- Contractor-internal. Never portal/customer-facing. No order/pay/message.

create table if not exists public.material_supply_draft_comparisons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  material_requirement_draft_id uuid not null
    references public.material_requirement_drafts (id) on delete restrict,
  policy_version text not null default 'material_supply.draft_compare.v1',
  offer_ids uuid[] not null,
  result_payload jsonb not null,
  issues text[] not null default '{}'::text[],
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists material_supply_draft_comparisons_req_idx
  on public.material_supply_draft_comparisons (
    tenant_id, material_requirement_draft_id, created_at desc
  );

comment on table public.material_supply_draft_comparisons is
  'AIS-MATERIAL-008 immutable supplier draft comparison; never portal-facing; not a purchase.';

alter table public.material_supply_draft_comparisons enable row level security;

revoke all on table public.material_supply_draft_comparisons from public, anon;
grant select, insert on table public.material_supply_draft_comparisons to authenticated;
grant all on table public.material_supply_draft_comparisons to service_role;

drop policy if exists material_supply_draft_comparisons_select
  on public.material_supply_draft_comparisons;
create policy material_supply_draft_comparisons_select
  on public.material_supply_draft_comparisons
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists material_supply_draft_comparisons_insert
  on public.material_supply_draft_comparisons;
create policy material_supply_draft_comparisons_insert
  on public.material_supply_draft_comparisons
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));
