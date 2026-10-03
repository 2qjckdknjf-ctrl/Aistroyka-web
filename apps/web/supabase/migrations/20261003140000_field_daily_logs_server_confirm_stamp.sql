-- Stamp confirmation attestation server-side. Client-supplied confirmed_by/at
-- on draft→confirmed must not be trusted (Cursor security review on PR #371).

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
    new.confirmed_by := auth.uid();
    new.confirmed_at := timezone('utc', now());
    if new.confirmed_by is null then
      raise exception 'field daily log confirmation requires an authenticated user';
    end if;
  else
    new.confirmed_by := old.confirmed_by;
    new.confirmed_at := old.confirmed_at;
  end if;
  return new;
end;
$$;
