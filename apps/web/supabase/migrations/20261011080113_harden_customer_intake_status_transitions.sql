-- Depends on 20261003170000_customer_intake_drafts.sql.
-- Direct authenticated PostgREST writes must obey the same lifecycle as
-- submit/withdraw routes: draft -> submitted OR withdrawn; terminal states
-- cannot be reopened or exchanged. Same-state retries and content edits remain valid.
create or replace function public.customer_intake_drafts_guard_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Preserve privileged maintenance; clients cannot issue service_role JWTs.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'draft' then
      raise exception 'Customer intake must start as draft' using errcode = '23514';
    end if;
  elsif new.status is distinct from old.status then
    if old.status is distinct from 'draft'
      or new.status is null
      or new.status not in ('submitted', 'withdrawn')
    then
      raise exception 'Customer intake status transition not permitted' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.customer_intake_drafts_guard_status() from public, anon, authenticated;

drop trigger if exists customer_intake_drafts_guard_status on public.customer_intake_drafts;
create trigger customer_intake_drafts_guard_status
  before insert or update on public.customer_intake_drafts
  for each row execute function public.customer_intake_drafts_guard_status();
