-- Explicit human review gate for durable vision results before Graph promotion.
-- Pending results remain contractor-internal evidence candidates, not proven Graph facts.
-- Preserve existing session/platform insert paths; default keeps new rows pending.
-- Repo bootstrap created ai_analysis without tenant_id; persist/review already require it.

alter table public.ai_analysis
  add column if not exists tenant_id uuid references public.tenants (id) on delete restrict,
  add column if not exists review_status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists review_note text;

update public.ai_analysis a
set tenant_id = m.tenant_id
from public.media m
where a.media_id = m.id
  and a.tenant_id is null;

-- Session/legacy inserts omit tenant_id; copy it from the job or media row.
create or replace function public.set_ai_analysis_tenant_id()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.tenant_id is null then
    if new.job_id is not null then
      select j.tenant_id into new.tenant_id
      from public.analysis_jobs j
      where j.id = new.job_id;
    end if;
    if new.tenant_id is null and new.media_id is not null then
      select m.tenant_id into new.tenant_id
      from public.media m
      where m.id = new.media_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists set_ai_analysis_tenant_id_trigger on public.ai_analysis;
create trigger set_ai_analysis_tenant_id_trigger
  before insert on public.ai_analysis
  for each row execute function public.set_ai_analysis_tenant_id();

revoke all on function public.set_ai_analysis_tenant_id() from public, anon, authenticated;
grant execute on function public.set_ai_analysis_tenant_id() to service_role;

alter table public.ai_analysis
  alter column tenant_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_analysis_review_status_check'
      and conrelid = 'public.ai_analysis'::regclass
  ) then
    alter table public.ai_analysis
      add constraint ai_analysis_review_status_check
      check (review_status = any (array[
        'pending'::text,
        'accepted'::text,
        'rejected'::text,
        'insufficient_evidence'::text
      ]));
  end if;
end;
$$;

comment on column public.ai_analysis.tenant_id is
  'Owning contractor tenant; copied from media or analysis_jobs for review isolation.';
comment on column public.ai_analysis.review_status is
  'Human review of durable vision result; only accepted may promote into Graph lineage.';
comment on column public.ai_analysis.reviewed_at is
  'When a manager/admin recorded the review verdict.';
comment on column public.ai_analysis.reviewed_by is
  'Auth user who recorded the review verdict.';
comment on column public.ai_analysis.review_note is
  'Optional reviewer reason; never customer-facing.';

create index if not exists ai_analysis_review_status_idx
  on public.ai_analysis (tenant_id, review_status, created_at desc);
