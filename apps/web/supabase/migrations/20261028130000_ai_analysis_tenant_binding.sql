-- Reconstruct the tenant prerequisite already present in the hosted schema.
-- Must precede the historical human-review index. No applied migration is edited.
-- Existing ownership is never guessed or rewritten: derive only missing values
-- from the referenced media and fail if any orphan remains.
alter table public.ai_analysis add column if not exists tenant_id uuid;

update public.ai_analysis a
set tenant_id = m.tenant_id
from public.media m
where a.media_id = m.id and a.tenant_id is null;

do $$
begin
  if exists (
    select 1 from public.ai_analysis a
    left join public.media m on m.id = a.media_id
    where m.tenant_id is null or a.tenant_id is distinct from m.tenant_id
  ) then
    raise exception 'Existing analysis source ownership requires explicit repair' using errcode = '23514';
  end if;
end;
$$;

alter table public.ai_analysis alter column tenant_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ai_analysis'::regclass
      and conname = 'ai_analysis_tenant_id_fkey'
  ) then
    alter table public.ai_analysis add constraint ai_analysis_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete restrict;
  end if;
end;
$$;

-- Legacy session completion inserts only media_id. Preserve that supported path
-- while rejecting an explicit tenant that disagrees with the immutable source.
create or replace function public.set_ai_analysis_tenant_id()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare source_tenant uuid;
begin
  select m.tenant_id into source_tenant from public.media m where m.id = new.media_id;
  if source_tenant is null then
    raise exception 'analysis media is unavailable' using errcode = '23503';
  end if;
  if new.tenant_id is not null and new.tenant_id <> source_tenant then
    raise exception 'analysis tenant must match media' using errcode = '23514';
  end if;
  new.tenant_id := source_tenant;
  return new;
end;
$$;
revoke all on function public.set_ai_analysis_tenant_id() from public, anon, authenticated;
grant execute on function public.set_ai_analysis_tenant_id() to service_role;
drop trigger if exists set_ai_analysis_tenant_id_trigger on public.ai_analysis;
create trigger set_ai_analysis_tenant_id_trigger
  before insert or update of media_id, tenant_id on public.ai_analysis
  for each row execute function public.set_ai_analysis_tenant_id();
