-- Stage2a A04: human acceptance decisions for quantity calculation revisions.
-- Separate from immutable calculation rows. No prices/margin. No auto commercial bind (A05).

create table if not exists public.quantity_acceptance_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  calculation_revision_id uuid not null
    references public.quantity_calculation_revisions (id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected', 'insufficient_basis')),
  note text,
  decided_by uuid not null references auth.users (id) on delete restrict,
  decided_at timestamptz not null default now(),
  unique (tenant_id, project_id, calculation_revision_id)
);

create index if not exists quantity_acceptance_decisions_project_idx
  on public.quantity_acceptance_decisions (tenant_id, project_id, decided_at desc);

comment on table public.quantity_acceptance_decisions is
  'Stage2a A04 human acceptance of a quantity calculation revision; not a commercial line.';

alter table public.quantity_acceptance_decisions enable row level security;

revoke all on table public.quantity_acceptance_decisions from public, anon;
grant select, insert on table public.quantity_acceptance_decisions to authenticated;
grant all on table public.quantity_acceptance_decisions to service_role;

drop policy if exists quantity_acceptance_decisions_select on public.quantity_acceptance_decisions;
create policy quantity_acceptance_decisions_select on public.quantity_acceptance_decisions
  for select using (public.is_internal_tenant_writer_for_tenant(tenant_id));

drop policy if exists quantity_acceptance_decisions_insert on public.quantity_acceptance_decisions;
create policy quantity_acceptance_decisions_insert on public.quantity_acceptance_decisions
  for insert with check (public.is_internal_tenant_writer_for_tenant(tenant_id));

-- Decisions are append-only for identity fields.
create or replace function public.enforce_quantity_acceptance_decision_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id
     or new.calculation_revision_id is distinct from old.calculation_revision_id
     or new.decision is distinct from old.decision
     or new.note is distinct from old.note
     or new.decided_by is distinct from old.decided_by
     or new.decided_at is distinct from old.decided_at then
    raise exception 'quantity_acceptance_decisions rows are immutable; create a new decision'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_quantity_acceptance_decision_immutable() from public;
grant execute on function public.enforce_quantity_acceptance_decision_immutable() to authenticated, service_role;

drop trigger if exists quantity_acceptance_decisions_immutable on public.quantity_acceptance_decisions;
create trigger quantity_acceptance_decisions_immutable
  before update on public.quantity_acceptance_decisions
  for each row execute function public.enforce_quantity_acceptance_decision_immutable();
