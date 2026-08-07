-- Defense-in-depth: when jobs.payload contains project_id, require that project
-- belongs to jobs.tenant_id. Does not replace application-level signing guards.
--
-- ROLLBACK:
--   drop trigger if exists jobs_payload_project_tenant_trg on public.jobs;
--   drop function if exists public.jobs_protect_payload_project_tenant();
--
-- DO NOT apply to production without owner approval.
-- Enqueue via authenticated tenant clients remains allowed; foreign project_id claims are rejected.

create or replace function public.jobs_protect_payload_project_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed text;
begin
  if new.payload is null then
    return new;
  end if;

  claimed := new.payload ->> 'project_id';
  if claimed is null or btrim(claimed) = '' then
    return new;
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = claimed::uuid
      and p.tenant_id = new.tenant_id
  ) then
    raise exception 'jobs.payload.project_id must belong to jobs.tenant_id'
      using errcode = '42501';
  end if;

  return new;
exception
  when invalid_text_representation then
    raise exception 'jobs.payload.project_id must be a valid uuid'
      using errcode = '22P02';
end;
$$;

drop trigger if exists jobs_payload_project_tenant_trg on public.jobs;

create trigger jobs_payload_project_tenant_trg
  before insert or update of payload, tenant_id on public.jobs
  for each row
  execute function public.jobs_protect_payload_project_tenant();

comment on function public.jobs_protect_payload_project_tenant() is
  'Blocks jobs whose payload.project_id is missing or not owned by jobs.tenant_id.';
