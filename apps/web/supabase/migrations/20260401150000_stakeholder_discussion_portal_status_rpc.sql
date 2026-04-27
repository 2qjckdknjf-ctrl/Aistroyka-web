-- Portal stakeholders may insert discussion entries (RLS) but cannot UPDATE discussions rows.
-- Status transitions after a participant entry are applied via this SECURITY DEFINER RPC.

create or replace function public.stakeholder_discussion_portal_set_status(
  p_discussion_id uuid,
  p_tenant_id uuid,
  p_next_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_current text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select d.project_id, d.status
  into v_project_id, v_current
  from public.project_stakeholder_discussions d
  where d.id = p_discussion_id and d.tenant_id = p_tenant_id;

  if v_project_id is null then
    return false;
  end if;

  if not public.is_portal_stakeholder_for_project(v_project_id) then
    raise exception 'forbidden';
  end if;

  -- Participant responses flip the thread to awaiting_manager from open / awaiting_stakeholder only.
  if p_next_status <> 'awaiting_manager' then
    raise exception 'invalid status';
  end if;

  if v_current not in ('open', 'awaiting_stakeholder') then
    raise exception 'invalid state';
  end if;

  update public.project_stakeholder_discussions
  set status = p_next_status,
      updated_at = now()
  where id = p_discussion_id
    and tenant_id = p_tenant_id;

  return found;
end;
$$;

revoke all on function public.stakeholder_discussion_portal_set_status(uuid, uuid, text) from public;
grant execute on function public.stakeholder_discussion_portal_set_status(uuid, uuid, text) to authenticated;
