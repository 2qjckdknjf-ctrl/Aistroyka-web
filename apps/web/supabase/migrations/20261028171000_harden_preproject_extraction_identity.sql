-- Harden AIS-CLIENT-005A extraction writes: bind project/draft/run to the row
-- tenant, and lock identity (including observation payload) on UPDATE.
-- Review still updates status/label/review_* via authenticated UPDATE.

create or replace function public.intake_draft_belongs_to_tenant(p_draft_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customer_intake_drafts d
    where d.id = p_draft_id
      and d.tenant_id = p_tenant_id
  );
$$;

revoke all on function public.intake_draft_belongs_to_tenant(uuid, uuid) from public, anon;
grant execute on function public.intake_draft_belongs_to_tenant(uuid, uuid) to authenticated, service_role;

comment on function public.intake_draft_belongs_to_tenant(uuid, uuid) is
  'True when customer_intake_drafts.id belongs to the given tenant_id; blocks cross-tenant draft FK writes.';

create or replace function public.preproject_extraction_run_belongs_to_tenant(p_run_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.preproject_extraction_runs r
    where r.id = p_run_id
      and r.tenant_id = p_tenant_id
  );
$$;

revoke all on function public.preproject_extraction_run_belongs_to_tenant(uuid, uuid) from public, anon;
grant execute on function public.preproject_extraction_run_belongs_to_tenant(uuid, uuid) to authenticated, service_role;

comment on function public.preproject_extraction_run_belongs_to_tenant(uuid, uuid) is
  'True when preproject_extraction_runs.id belongs to the given tenant_id; blocks cross-tenant run FK writes.';

drop policy if exists preproject_extraction_runs_insert on public.preproject_extraction_runs;
create policy preproject_extraction_runs_insert on public.preproject_extraction_runs
  for insert with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
    and (
      intake_draft_id is null
      or public.intake_draft_belongs_to_tenant(intake_draft_id, tenant_id)
    )
  );

drop policy if exists preproject_extraction_runs_update on public.preproject_extraction_runs;
create policy preproject_extraction_runs_update on public.preproject_extraction_runs
  for update
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
    and (
      intake_draft_id is null
      or public.intake_draft_belongs_to_tenant(intake_draft_id, tenant_id)
    )
  );

drop policy if exists preproject_observations_insert on public.preproject_observations;
create policy preproject_observations_insert on public.preproject_observations
  for insert with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.preproject_extraction_run_belongs_to_tenant(run_id, tenant_id)
  );

drop policy if exists preproject_observations_update on public.preproject_observations;
create policy preproject_observations_update on public.preproject_observations
  for update
  using (public.is_internal_tenant_writer_for_tenant(tenant_id))
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.preproject_extraction_run_belongs_to_tenant(run_id, tenant_id)
  );

create or replace function public.enforce_preproject_extraction_run_identity_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.tenant_id is distinct from old.tenant_id
     or new.project_id is distinct from old.project_id
     or new.intake_draft_id is distinct from old.intake_draft_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'preproject_extraction_runs identity fields are immutable';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_preproject_observation_identity_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.tenant_id is distinct from old.tenant_id
     or new.run_id is distinct from old.run_id
     or new.payload is distinct from old.payload
     or new.created_at is distinct from old.created_at then
    raise exception 'preproject_observations identity fields are immutable';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_preproject_extraction_run_identity_immutable() from public, anon, authenticated;
revoke all on function public.enforce_preproject_observation_identity_immutable() from public, anon, authenticated;
grant execute on function public.enforce_preproject_extraction_run_identity_immutable() to service_role;
grant execute on function public.enforce_preproject_observation_identity_immutable() to service_role;

drop trigger if exists preproject_extraction_runs_identity_immutable on public.preproject_extraction_runs;
create trigger preproject_extraction_runs_identity_immutable
  before update on public.preproject_extraction_runs
  for each row execute function public.enforce_preproject_extraction_run_identity_immutable();

drop trigger if exists preproject_observations_identity_immutable on public.preproject_observations;
create trigger preproject_observations_identity_immutable
  before update on public.preproject_observations
  for each row execute function public.enforce_preproject_observation_identity_immutable();

comment on function public.enforce_preproject_extraction_run_identity_immutable() is
  'Prevents authenticated REST updates from moving a run across tenants or rebinding project/draft identity.';

comment on function public.enforce_preproject_observation_identity_immutable() is
  'Prevents authenticated REST updates from moving an observation, rebinding run_id, or rewriting payload.';
