-- Atomic bulk owner decision for project documents.
-- All updates happen in one transaction scope (RPC call).

create or replace function public.owner_bulk_decide_documents(
  p_project_id uuid,
  p_tenant_id uuid,
  p_action text,
  p_document_ids uuid[],
  p_comment text default null
)
returns table (
  document_id uuid,
  ok boolean,
  error text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_to_status text;
  v_event_type text;
  v_decision_label text;
  v_trimmed_comment text;
  v_input_count int := 0;
  v_updated_count int := 0;
  r record;
  v_updated_ids uuid[] := '{}';
  v_updated_titles text[] := '{}';
  v_updated_types text[] := '{}';
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_action not in ('approve', 'reject', 'request_changes') then
    raise exception 'invalid action';
  end if;

  select count(*)
  into v_input_count
  from (
    select distinct unnest(p_document_ids) as id
  ) q;

  if v_input_count = 0 then
    raise exception 'document_ids required';
  end if;

  if v_input_count > 20 then
    raise exception 'bulk decision limit is 20';
  end if;

  if not exists (
    select 1
    from public.project_members pm
    where pm.tenant_id = p_tenant_id
      and pm.project_id = p_project_id
      and pm.user_id = v_user_id
      and pm.role = 'owner'
      and pm.status = 'active'
  ) then
    raise exception 'forbidden';
  end if;

  if exists (
    with input_ids as (
      select distinct unnest(p_document_ids) as document_id
    ),
    validated as (
      select
        i.document_id,
        d.id as existing_id,
        d.status as existing_status
      from input_ids i
      left join public.project_documents d
        on d.id = i.document_id
       and d.tenant_id = p_tenant_id
       and d.project_id = p_project_id
    )
    select 1
    from validated v
    where v.existing_id is null
       or v.existing_status <> 'under_review'
  ) then
    return query
    with input_ids as (
      select distinct unnest(p_document_ids) as id
    ),
    validated as (
      select
        i.id as document_id,
        d.id as existing_id,
        d.status as existing_status
      from input_ids i
      left join public.project_documents d
        on d.id = i.id
       and d.tenant_id = p_tenant_id
       and d.project_id = p_project_id
    )
    select
      v.document_id,
      false as ok,
      case
        when v.existing_id is null then 'Document not found'
        when v.existing_status <> 'under_review' then 'Document is not pending decision'
        else null
      end as error
    from validated v
    where v.existing_id is null
       or v.existing_status <> 'under_review'
    order by v.document_id;

    return;
  end if;

  v_to_status := case
    when p_action = 'approve' then 'approved'
    when p_action = 'reject' then 'rejected'
    else 'changes_requested'
  end;

  v_event_type := case
    when p_action = 'approve' then 'approved'
    when p_action = 'reject' then 'rejected'
    else 'changes_requested'
  end;

  v_decision_label := case
    when p_action = 'approve' then 'approved'
    when p_action = 'reject' then 'rejected'
    else 'changes requested'
  end;

  v_trimmed_comment := nullif(left(btrim(coalesce(p_comment, '')), 2000), '');

  for r in
    update public.project_documents d
    set
      status = v_to_status,
      decision_comment = v_trimmed_comment,
      decided_by = v_user_id,
      updated_at = now()
    where d.tenant_id = p_tenant_id
      and d.project_id = p_project_id
      and d.id in (
        select distinct unnest(p_document_ids)
      )
      and d.status = 'under_review'
    returning d.id, d.title, d.type
  loop
    v_updated_count := v_updated_count + 1;
    v_updated_ids := array_append(v_updated_ids, r.id);
    v_updated_titles := array_append(v_updated_titles, r.title);
    v_updated_types := array_append(v_updated_types, r.type);
  end loop;

  if v_updated_count <> v_input_count then
    raise exception 'batch_conflict';
  end if;

  insert into public.project_document_events (
    tenant_id,
    document_id,
    event_type,
    actor_user_id,
    note
  )
  select
    p_tenant_id,
    u.id,
    v_event_type,
    v_user_id,
    v_trimmed_comment
  from unnest(v_updated_ids) as u(id);

  insert into public.audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  select
    p_tenant_id,
    v_user_id,
    'document_review',
    'document',
    d.id::text,
    jsonb_build_object(
      'from', 'under_review',
      'to', v_to_status,
      'action', p_action,
      'comment', v_trimmed_comment,
      'type', d.type,
      'project_id', p_project_id
    )
  from unnest(v_updated_ids, v_updated_types) as d(id, type);

  insert into public.manager_notifications (
    tenant_id,
    user_id,
    type,
    title,
    body,
    target_type,
    target_id,
    project_id
  )
  select
    p_tenant_id,
    pm.user_id,
    'document_owner_decision',
    format('Document %s', v_decision_label),
    d.title,
    'document',
    d.id::text,
    p_project_id
  from (
    select distinct user_id
    from public.project_members
    where tenant_id = p_tenant_id
      and project_id = p_project_id
      and role in ('manager', 'owner')
      and status = 'active'
  ) pm
  cross join unnest(v_updated_ids, v_updated_titles) as d(id, title);

  return query
  select
    u.id as document_id,
    true as ok,
    null::text as error
  from unnest(v_updated_ids) as u(id)
  order by u.id;
end;
$$;

revoke all on function public.owner_bulk_decide_documents(uuid, uuid, text, uuid[], text) from public;
grant execute on function public.owner_bulk_decide_documents(uuid, uuid, text, uuid[], text) to authenticated;
