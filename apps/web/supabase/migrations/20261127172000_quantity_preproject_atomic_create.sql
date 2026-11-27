-- Monthly review follow-through: atomic immutable snapshot/spec and extraction/observations.
-- Additive migration. Apply only through the verified-receipt and owner release gates.

create or replace function public.create_quantity_snapshot_atomic(
  p_tenant_id uuid, p_project_id uuid, p_actor_user_id uuid,
  p_spec jsonb, p_request jsonb, p_request_hash text, p_evidence_refs jsonb
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog
as $$
declare
  v_snapshot public.quantity_input_snapshots%rowtype;
  v_spec_id uuid;
  v_revision integer;
begin
  if auth.uid() is null or p_actor_user_id is distinct from auth.uid()
     or public.is_internal_tenant_writer_for_tenant(p_tenant_id) is not true
     or public.project_belongs_to_tenant(p_project_id, p_tenant_id) is not true then
    raise exception using errcode = '42501', message = 'Forbidden quantity create';
  end if;
  if public.is_tenant_owner_or_admin(p_tenant_id) is not true
     and coalesce(p_request->>'quantity_kind', '') not in ('reported', 'measured') then
    raise exception using errcode = '42501', message = 'Workers may only write reported or measured snapshots';
  end if;
  if jsonb_typeof(p_spec) is distinct from 'object'
     or jsonb_typeof(p_request) is distinct from 'object'
     or jsonb_typeof(p_evidence_refs) is distinct from 'array'
     or p_request_hash is null or p_request_hash !~ '^[a-f0-9]{64}$'
     or p_spec->>'work_code' is null or p_spec->>'rule_version' is null
     or p_spec->>'work_code' is distinct from p_request->>'work_code'
     or p_spec->>'rule_version' is distinct from p_request->>'rule_version' then
    raise exception using errcode = '22023', message = 'Invalid quantity snapshot input';
  end if;

  -- Serializes max+1 allocation and hash lookup across all requests for this work code.
  perform pg_advisory_xact_lock(hashtextextended(
    'quantity_snapshot:' || p_tenant_id::text || ':' || p_project_id::text || ':' || (p_spec->>'work_code'), 0));
  select * into v_snapshot from public.quantity_input_snapshots
    where tenant_id = p_tenant_id and project_id = p_project_id and request_hash = p_request_hash;
  if found then
    if v_snapshot.request_payload is distinct from p_request then
      raise exception using errcode = '22023', message = 'Request hash does not match stored input';
    end if;
    return jsonb_build_object('snapshot', to_jsonb(v_snapshot), 'created', false);
  end if;

  select coalesce(max(revision), 0) + 1 into v_revision
    from public.quantity_work_specifications
    where tenant_id = p_tenant_id and project_id = p_project_id and work_code = p_spec->>'work_code';
  insert into public.quantity_work_specifications (
    tenant_id, project_id, work_code, rule_version, unit, quantity_basis, rule_id, title, revision, created_by
  ) values (
    p_tenant_id, p_project_id, p_spec->>'work_code', p_spec->>'rule_version', p_spec->>'unit',
    p_spec->>'quantity_basis', p_spec->>'rule_id', p_spec->>'title', v_revision, p_actor_user_id
  ) returning id into v_spec_id;
  if not found or v_spec_id is null then
    raise exception using errcode = 'P0001', message = 'SPEC_INSERT_INCOMPLETE';
  end if;
  insert into public.quantity_input_snapshots (
    tenant_id, project_id, work_specification_id, work_code, rule_version, quantity_kind,
    request_kind, request_payload, request_hash, evidence_refs, created_by
  ) values (
    p_tenant_id, p_project_id, v_spec_id, p_request->>'work_code', p_request->>'rule_version',
    p_request->>'quantity_kind', p_request->>'kind', p_request, p_request_hash, p_evidence_refs, p_actor_user_id
  ) returning * into v_snapshot;
  if not found or v_snapshot.id is null then
    raise exception using errcode = 'P0001', message = 'SNAPSHOT_INSERT_INCOMPLETE';
  end if;
  -- Any failed snapshot write rolls back the specification insert in the same transaction.
  return jsonb_build_object('snapshot', to_jsonb(v_snapshot), 'created', true);
end;
$$;

-- A manager may read a customer's intake without the creator-only UPDATE grant.
-- Lock only that authorized source row; do not widen its table write policies.
create or replace function app_private.lock_intake_draft_for_extraction(
  p_tenant_id uuid, p_project_id uuid, p_intake_draft_id uuid
) returns void
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_draft public.customer_intake_drafts%rowtype;
begin
  if auth.uid() is null
     or public.is_internal_tenant_writer_for_tenant(p_tenant_id) is not true
     or app_private.customer_intake_tenant_account_active(p_tenant_id) is not true
     or public.project_belongs_to_tenant(p_project_id, p_tenant_id) is not true then
    raise exception using errcode = '42501', message = 'Forbidden intake source lock';
  end if;
  select * into v_draft from public.customer_intake_drafts
    where tenant_id = p_tenant_id and id = p_intake_draft_id for share;
  if not found then raise exception using errcode = 'P0001', message = 'DRAFT_NOT_FOUND'; end if;
  if v_draft.status = 'withdrawn' then raise exception using errcode = 'P0001', message = 'DRAFT_WITHDRAWN'; end if;
  if v_draft.project_id is not null and v_draft.project_id <> p_project_id then
    raise exception using errcode = 'P0001', message = 'DRAFT_PROJECT_MISMATCH';
  end if;
end;
$$;

create or replace function public.create_preproject_extraction_atomic(
  p_tenant_id uuid, p_project_id uuid, p_actor_user_id uuid, p_intake_draft_id uuid,
  p_input_hash text, p_observations jsonb
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog
as $$
declare
  v_run public.preproject_extraction_runs%rowtype;
  v_draft public.customer_intake_drafts%rowtype;
  v_observations jsonb;
  v_expected integer;
  v_inserted integer;
  v_reused boolean := false;
begin
  if auth.uid() is null or p_actor_user_id is distinct from auth.uid()
     or public.is_internal_tenant_writer_for_tenant(p_tenant_id) is not true
     or (p_project_id is not null and public.project_belongs_to_tenant(p_project_id, p_tenant_id) is not true) then
    raise exception using errcode = '42501', message = 'Forbidden extraction create';
  end if;
  if p_input_hash is null or p_input_hash !~ '^[a-f0-9]{64}$'
     or jsonb_typeof(p_observations) is distinct from 'array'
     or jsonb_array_length(p_observations) > 100 then
    raise exception using errcode = '22023', message = 'Invalid extraction input';
  end if;

  if p_intake_draft_id is not null then
    if p_project_id is null then
      raise exception using errcode = '22023', message = 'Project required for intake draft';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(
      'preproject_draft:' || p_tenant_id::text || ':' || p_intake_draft_id::text, 0));
    perform app_private.lock_intake_draft_for_extraction(p_tenant_id, p_project_id, p_intake_draft_id);
    select * into v_draft from public.customer_intake_drafts
      where id = p_intake_draft_id and tenant_id = p_tenant_id;
    if not found then raise exception using errcode = 'P0001', message = 'DRAFT_NOT_FOUND'; end if;
    if v_draft.status = 'withdrawn' then raise exception using errcode = 'P0001', message = 'DRAFT_WITHDRAWN'; end if;
    if v_draft.project_id is not null and v_draft.project_id <> p_project_id then
      raise exception using errcode = 'P0001', message = 'DRAFT_PROJECT_MISMATCH';
    end if;
    select * into v_run from public.preproject_extraction_runs
      where tenant_id = p_tenant_id and intake_draft_id = p_intake_draft_id;
    if found then
      if v_run.project_id is distinct from p_project_id then
        raise exception using errcode = 'P0001', message = 'DRAFT_PROJECT_MISMATCH';
      end if;
      if v_run.source_ref is distinct from 'text_heuristic.v1'
         or v_run.status not in ('pending_review', 'partially_reviewed', 'reviewed')
         or coalesce(v_run.provider_meta->>'observation_count', '') !~ '^[0-9]{1,3}$' then
        raise exception using errcode = 'P0001', message = 'RUN_INCOMPLETE';
      end if;
      v_expected := (v_run.provider_meta->>'observation_count')::integer;
      select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at, o.id), '[]'::jsonb)
        into v_observations from public.preproject_observations o
        where o.tenant_id = p_tenant_id and o.run_id = v_run.id;
      if jsonb_array_length(v_observations) <> v_expected then
        -- Legacy rows did not retain the original input: never invent a repair from new text.
        raise exception using errcode = 'P0001', message = 'RUN_INCOMPLETE';
      end if;
      if v_run.provider_meta ? 'input_hash' and v_run.provider_meta->>'input_hash' is distinct from p_input_hash then
        raise exception using errcode = 'P0001', message = 'DRAFT_INPUT_MISMATCH';
      end if;
      v_reused := true;
    end if;
  end if;

  if not v_reused then
    insert into public.preproject_extraction_runs (
      tenant_id, project_id, intake_draft_id, status, source_kind, source_ref, provider_meta, created_by
    ) values (
      p_tenant_id, p_project_id, p_intake_draft_id, 'pending_review', 'text_heuristic', 'text_heuristic.v1',
      jsonb_build_object('engine', 'text_heuristic.v1', 'observation_count', jsonb_array_length(p_observations), 'input_hash', p_input_hash),
      p_actor_user_id
    ) returning * into v_run;
    if not found or v_run.id is null then
      raise exception using errcode = 'P0001', message = 'RUN_INSERT_INCOMPLETE';
    end if;
    insert into public.preproject_observations (
      tenant_id, run_id, kind, label, payload, uncertainty, source_coords, review_status
    ) select p_tenant_id, v_run.id, o->>'kind', o->>'label', o->'payload',
        o->>'uncertainty', o->'source_coords', 'pending'
      from jsonb_array_elements(p_observations) o;
    get diagnostics v_inserted = row_count;
    if v_inserted <> jsonb_array_length(p_observations) then
      raise exception using errcode = 'P0001', message = 'OBSERVATIONS_INSERT_INCOMPLETE';
    end if;
    select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at, o.id), '[]'::jsonb)
      into v_observations from public.preproject_observations o
      where o.tenant_id = p_tenant_id and o.run_id = v_run.id;
    if jsonb_array_length(v_observations) <> v_inserted then
      raise exception using errcode = 'P0001', message = 'OBSERVATIONS_INSERT_INCOMPLETE';
    end if;
  end if;
  return jsonb_build_object('run', to_jsonb(v_run) || jsonb_build_object('observations', v_observations), 'reused', v_reused);
end;
$$;

revoke all on function public.create_quantity_snapshot_atomic(uuid, uuid, uuid, jsonb, jsonb, text, jsonb) from public, anon;
revoke all on function public.create_preproject_extraction_atomic(uuid, uuid, uuid, uuid, text, jsonb) from public, anon;
revoke all on function app_private.lock_intake_draft_for_extraction(uuid, uuid, uuid) from public, anon;
grant execute on function public.create_quantity_snapshot_atomic(uuid, uuid, uuid, jsonb, jsonb, text, jsonb) to authenticated;
grant execute on function public.create_preproject_extraction_atomic(uuid, uuid, uuid, uuid, text, jsonb) to authenticated;
grant execute on function app_private.lock_intake_draft_for_extraction(uuid, uuid, uuid) to authenticated;
