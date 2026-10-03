-- Customer intake drafts: structured request state, no AI output.
-- RLS: internal readers may list tenant drafts; portal/customers may see only
-- their own rows, and only while they still have current tenant/project access.

create table if not exists public.customer_intake_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null,
  site_context text,
  location jsonb not null default '{"precision":"city"}'::jsonb,
  requested_work_type text,
  budget_range text,
  desired_start date,
  desired_end date,
  media_refs jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_intake_tenant_creator
  on public.customer_intake_drafts (tenant_id, created_by);

alter table public.customer_intake_drafts enable row level security;

alter table public.customer_intake_drafts
  alter column location set default '{"precision":"city"}'::jsonb;

alter table public.customer_intake_drafts
  drop constraint if exists customer_intake_drafts_location_precision;
alter table public.customer_intake_drafts
  drop constraint if exists customer_intake_drafts_location_shape;

create or replace function public.customer_intake_jsonb_finite_number(p jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(
    jsonb_typeof(p) = 'number'
    and (p #>> '{}')::double precision
      between -1.7976931348623157e+308 and 1.7976931348623157e+308,
    false
  );
$$;

create or replace function public.customer_intake_location_valid(p jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(
    jsonb_typeof(p) = 'object'
    and (p ? 'precision') is true
    and jsonb_typeof(p->'precision') = 'string'
    and (p->>'precision') in ('address', 'city', 'region', 'coordinates')
    and (
      (p ? 'label') is not true
      or jsonb_typeof(p->'label') = 'string'
    )
    and (
      (p ? 'lat') is not true
      or public.customer_intake_jsonb_finite_number(p->'lat')
    )
    and (
      (p ? 'lng') is not true
      or public.customer_intake_jsonb_finite_number(p->'lng')
    ),
    false
  );
$$;

alter table public.customer_intake_drafts
  add constraint customer_intake_drafts_location_shape
  check (public.customer_intake_location_valid(location) is true);

alter table public.customer_intake_drafts
  drop constraint if exists customer_intake_drafts_questions_array;
alter table public.customer_intake_drafts
  add constraint customer_intake_drafts_questions_array
  check (jsonb_typeof(questions) = 'array');

alter table public.customer_intake_drafts
  drop constraint if exists customer_intake_drafts_media_refs_array;
alter table public.customer_intake_drafts
  add constraint customer_intake_drafts_media_refs_array
  check (jsonb_typeof(media_refs) = 'array');

create or replace function public.customer_intake_js_trim(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
    regexp_replace(
      coalesce(p, ''),
      '^[' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) || chr(133) || chr(160) || chr(5760)
        || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199)
        || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288)
        || chr(65279) || ']+',
      ''
    ),
    '[' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) || chr(133) || chr(160) || chr(5760)
      || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199)
      || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288)
      || chr(65279) || ']+$',
    ''
  );
$$;

create or replace function public.customer_intake_js_length(p text)
returns integer
language sql
immutable
set search_path = public
as $$
  select coalesce(
    char_length(p)
      + char_length(p)
      - char_length(regexp_replace(p, E'[\\U00010000-\\U0010FFFF]', '', 'g')),
    0
  );
$$;

alter table public.customer_intake_drafts
  drop constraint if exists customer_intake_drafts_title_nonblank;
alter table public.customer_intake_drafts
  add constraint customer_intake_drafts_title_nonblank
  check (public.customer_intake_js_length(public.customer_intake_js_trim(title)) >= 1);

alter table public.customer_intake_drafts
  drop constraint if exists customer_intake_drafts_description_nonblank;
alter table public.customer_intake_drafts
  add constraint customer_intake_drafts_description_nonblank
  check (public.customer_intake_js_length(public.customer_intake_js_trim(description)) >= 1);

create or replace function public.customer_intake_tenant_account_active(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenants t
    join public.accounts a on a.id = t.account_id
    where t.id = p_tenant_id
      and a.status = 'active'
  );
$$;

comment on function public.customer_intake_tenant_account_active(uuid) is
  'Fail closed when the tenant account is missing, suspended, or closed.';

revoke all on function public.customer_intake_tenant_account_active(uuid) from public;
grant execute on function public.customer_intake_tenant_account_active(uuid) to authenticated;

create or replace function public.customer_intake_questions_valid(p jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select jsonb_typeof(p) = 'array'
    and jsonb_array_length(p) <= 20
    and coalesce((
      select bool_and(
        case
          when jsonb_typeof(e) = 'string' then public.customer_intake_js_length(public.customer_intake_js_trim(e #>> '{}')) between 1 and 500
          else false
        end
      )
      from jsonb_array_elements(p) e
    ), true);
$$;

create or replace function public.customer_intake_media_id_value_valid(p jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select jsonb_typeof(p) = 'string'
    and public.customer_intake_js_length(public.customer_intake_js_trim(p #>> '{}')) between 1 and 128;
$$;

create or replace function public.customer_intake_https_url_text_valid(p text)
returns boolean
language sql
immutable
set search_path = public
as $$
  with u as (
    select public.customer_intake_js_trim(p) as t
  ),
  parsed as (
    select
      t,
      substring(t from '^https://(?:(?:%[0-9A-Fa-f]{2}|[A-Za-z0-9._~!$&''()*+,;=:-])+@)?([^/:?#]+)') as host
    from u
  )
  select coalesce(
    public.customer_intake_js_length(parsed.t) between 1 and 2048
    and parsed.t ~ (
      '^https://'
      || '(?:(?:%[0-9A-Fa-f]{2}|[A-Za-z0-9._~!$&''()*+,;=:-])+@)?'
      || '(?:localhost|(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])|(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*)'
      || '(?::(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{0,3}|0))?'
      || '(?:[/?#](?:%[0-9A-Fa-f]{2}|[][A-Za-z0-9._~!$&''()*+,;=:@/?-])*)?'
      || '$'
    )
    and (
      parsed.host = 'localhost'
      or parsed.host ~ '^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$'
      or parsed.host ~ '[A-Za-z]'
    )
    and (
      parsed.t !~ (
        '^https://'
        || '(?:(?:%[0-9A-Fa-f]{2}|[A-Za-z0-9._~!$&''()*+,;=:-])+@)?'
        || '(?:[0-9]+\.){3}[0-9]+'
        || '(?::[0-9]+)?(?:[/?#]|$)'
      )
      or parsed.t ~ (
        '^https://'
        || '(?:(?:%[0-9A-Fa-f]{2}|[A-Za-z0-9._~!$&''()*+,;=:-])+@)?'
        || '(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])'
        || '(?::(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{0,3}|0))?'
        || '(?:[/?#](?:%[0-9A-Fa-f]{2}|[][A-Za-z0-9._~!$&''()*+,;=:@/?-])*)?'
        || '$'
      )
    ),
    false
  )
  from parsed;
$$;

create or replace function public.customer_intake_media_url_value_valid(p jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select jsonb_typeof(p) = 'string'
    and public.customer_intake_https_url_text_valid(p #>> '{}');
$$;

create or replace function public.customer_intake_media_refs_valid(p jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select jsonb_typeof(p) = 'array'
    and jsonb_array_length(p) <= 20
    and coalesce((
      select bool_and(
        case
          when jsonb_typeof(e) <> 'object' then false
          else (
            not exists (
              select 1
              from jsonb_object_keys(e) as media_key(key)
              where media_key.key not in ('kind', 'media_id', 'url')
            )
            and e ? 'kind'
            and jsonb_typeof(e->'kind') = 'string'
            and (e->>'kind') in ('image', 'video', 'document')
            and (
              (not (e ? 'media_id') or public.customer_intake_media_id_value_valid(e->'media_id'))
              and (not (e ? 'url') or public.customer_intake_media_url_value_valid(e->'url'))
              and (
                (e ? 'media_id' and public.customer_intake_media_id_value_valid(e->'media_id'))
                or (e ? 'url' and public.customer_intake_media_url_value_valid(e->'url'))
              )
            )
          )
        end
      )
      from jsonb_array_elements(p) e
    ), true);
$$;

create or replace function public.customer_intake_drafts_validate_arrays()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.customer_intake_location_valid(new.location) then
    raise exception 'customer_intake_drafts.location is invalid';
  end if;
  if not public.customer_intake_questions_valid(new.questions) then
    raise exception 'customer_intake_drafts.questions is invalid';
  end if;
  if not public.customer_intake_media_refs_valid(new.media_refs) then
    raise exception 'customer_intake_drafts.media_refs is invalid';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_intake_drafts_validate_arrays on public.customer_intake_drafts;
create trigger customer_intake_drafts_validate_arrays
  before insert or update on public.customer_intake_drafts
  for each row
  execute function public.customer_intake_drafts_validate_arrays();

drop function if exists public.customer_intake_has_current_tenant_access(uuid);
drop function if exists public.customer_intake_project_scope_ok(uuid, uuid);

create or replace function public.is_internal_intake_reader(p_tenant_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.is_internal_tenant_reader_for_tenant(p_tenant_id);
$$;

comment on function public.is_internal_intake_reader(uuid) is
  'Internal workspace reader (owner/admin/member/viewer). Never true for portal-only stakeholder.';

revoke all on function public.is_internal_intake_reader(uuid) from public;
grant execute on function public.is_internal_intake_reader(uuid) to authenticated;

create or replace function public.is_internal_intake_writer(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant_id and t.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin', 'member')
  );
$$;

comment on function public.is_internal_intake_writer(uuid) is
  'Internal intake writer: tenant owner or tenant_members owner/admin/member. Viewers cannot insert or update.';

revoke all on function public.is_internal_intake_writer(uuid) from public;
grant execute on function public.is_internal_intake_writer(uuid) to authenticated;

create or replace function public.has_active_stakeholder_grant_in_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_stakeholders ps
    where ps.tenant_id = p_tenant_id
      and ps.user_id = (select auth.uid())
      and ps.status = 'active'
  );
$$;

comment on function public.has_active_stakeholder_grant_in_tenant(uuid) is
  'True only with at least one current project_stakeholders.status = active in the tenant. tenant_members.role = stakeholder is not enough.';

revoke all on function public.has_active_stakeholder_grant_in_tenant(uuid) from public;
grant execute on function public.has_active_stakeholder_grant_in_tenant(uuid) to authenticated;

create or replace function public.has_active_stakeholder_grant_for_project(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select public.is_portal_stakeholder_for_project(p_project_id);
$$;

comment on function public.has_active_stakeholder_grant_for_project(uuid) is
  'Alias for is_portal_stakeholder_for_project: active project_stakeholders grant for auth.uid().';

revoke all on function public.has_active_stakeholder_grant_for_project(uuid) from public;
grant execute on function public.has_active_stakeholder_grant_for_project(uuid) to authenticated;

create or replace function public.customer_intake_stakeholder_authorized(p_project_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_project_id is null then
      public.has_active_stakeholder_grant_in_tenant(p_tenant_id)
    else
      public.project_belongs_to_tenant(p_project_id, p_tenant_id)
      and exists (
        select 1
        from public.project_stakeholders ps
        where ps.project_id = p_project_id
          and ps.tenant_id = p_tenant_id
          and ps.user_id = (select auth.uid())
          and ps.status = 'active'
      )
  end;
$$;

comment on function public.customer_intake_stakeholder_authorized(uuid, uuid) is
  'Project-linked drafts need an active grant on that project. Projectless drafts need any active grant in the tenant. Revoked grants deny.';

revoke all on function public.customer_intake_stakeholder_authorized(uuid, uuid) from public;
grant execute on function public.customer_intake_stakeholder_authorized(uuid, uuid) to authenticated;

create or replace function public.customer_intake_drafts_immutable_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'customer_intake_drafts.tenant_id is immutable';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'customer_intake_drafts.created_by is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_intake_drafts_immutable_identity on public.customer_intake_drafts;
create trigger customer_intake_drafts_immutable_identity
  before update on public.customer_intake_drafts
  for each row
  execute function public.customer_intake_drafts_immutable_identity();

drop policy if exists customer_intake_drafts_select on public.customer_intake_drafts;
create policy customer_intake_drafts_select on public.customer_intake_drafts
  for select
  to authenticated
  using (
    public.customer_intake_tenant_account_active(tenant_id)
    and (
      public.is_internal_intake_reader(tenant_id)
      or (
        created_by = (select auth.uid())
        and public.customer_intake_stakeholder_authorized(project_id, tenant_id)
      )
    )
  );

drop policy if exists customer_intake_drafts_insert on public.customer_intake_drafts;
create policy customer_intake_drafts_insert on public.customer_intake_drafts
  for insert
  to authenticated
  with check (
    public.customer_intake_tenant_account_active(tenant_id)
    and created_by = (select auth.uid())
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
    and (
      public.is_internal_intake_writer(tenant_id)
      or public.customer_intake_stakeholder_authorized(project_id, tenant_id)
    )
  );

drop policy if exists customer_intake_drafts_update on public.customer_intake_drafts;
create policy customer_intake_drafts_update on public.customer_intake_drafts
  for update
  to authenticated
  using (
    public.customer_intake_tenant_account_active(tenant_id)
    and created_by = (select auth.uid())
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
    and (
      public.is_internal_intake_writer(tenant_id)
      or public.customer_intake_stakeholder_authorized(project_id, tenant_id)
    )
  )
  with check (
    public.customer_intake_tenant_account_active(tenant_id)
    and created_by = (select auth.uid())
    and (
      project_id is null
      or public.project_belongs_to_tenant(project_id, tenant_id)
    )
    and (
      public.is_internal_intake_writer(tenant_id)
      or public.customer_intake_stakeholder_authorized(project_id, tenant_id)
    )
  );

drop policy if exists customer_intake_drafts_delete on public.customer_intake_drafts;
create policy customer_intake_drafts_delete on public.customer_intake_drafts
  for delete
  to authenticated
  using (false);
