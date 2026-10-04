-- Stamp confirmation attestation server-side. Client-supplied confirmed_by/at
-- must not be trusted on insert or on draft→confirmed (PR #371 P1).

create or replace function public.enforce_field_daily_log_identity_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'draft' then
      new.created_by := auth.uid();
      new.created_at := timezone('utc', now());
      new.confirmed_by := null;
      new.confirmed_at := null;
    elsif new.status = 'confirmed' then
      new.confirmed_by := auth.uid();
      new.confirmed_at := timezone('utc', now());
      if new.confirmed_by is null then
        raise exception 'field daily log confirmation requires an authenticated user';
      end if;
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.tenant_id is distinct from old.tenant_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'field daily log identity fields are immutable';
  end if;
  if old.status = 'confirmed' then
    raise exception 'confirmed field daily logs cannot be updated';
  end if;
  if old.status = 'draft' and new.status = 'confirmed' then
    -- Never persist client-supplied confirmed_by / confirmed_at.
    new.confirmed_by := auth.uid();
    new.confirmed_at := timezone('utc', now());
    if new.confirmed_by is null then
      raise exception 'field daily log confirmation requires an authenticated user';
    end if;
  else
    new.confirmed_by := null;
    new.confirmed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists field_daily_logs_identity_immutable on public.field_daily_logs;
create trigger field_daily_logs_identity_immutable
  before insert or update on public.field_daily_logs
  for each row execute function public.enforce_field_daily_log_identity_immutable();

drop policy if exists field_daily_logs_insert_internal on public.field_daily_logs;
create policy field_daily_logs_insert_internal on public.field_daily_logs
  for insert
  to authenticated
  with check (
    public.is_internal_tenant_writer_for_tenant(tenant_id)
    and public.project_belongs_to_tenant(project_id, tenant_id)
    and status = 'draft'
    and (created_by is null or created_by = (select auth.uid()))
    and confirmed_by is null
    and confirmed_at is null
  );
