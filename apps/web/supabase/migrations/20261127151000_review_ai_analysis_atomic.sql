-- One row lock and one transaction for the verdict and its immutable provenance.
-- Preserve the HTTP route's internal owner/admin/member review cohort. Only its server client
-- may call this function; validate the supplied reviewer again inside the boundary.
create or replace function public.review_ai_analysis_atomic(
  p_analysis_id uuid,
  p_tenant_id uuid,
  p_reviewer_user_id uuid,
  p_status text,
  p_note text default null,
  p_corrected_payload jsonb default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  original public.ai_analysis%rowtype;
  reviewed public.ai_analysis%rowtype;
  original_snapshot jsonb;
  corrected_snapshot jsonb;
  correction_id uuid;
  stamp timestamptz;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'server review client required' using errcode = '42501';
  end if;
  if p_analysis_id is null or p_tenant_id is null or p_reviewer_user_id is null
     or p_status is null or p_status not in ('accepted','edited','rejected','insufficient_evidence') then
    raise exception 'invalid review input' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.tenants t where t.id = p_tenant_id
      and (t.user_id = p_reviewer_user_id or exists (
        select 1 from public.tenant_members tm
        where tm.tenant_id = t.id and tm.user_id = p_reviewer_user_id and tm.role in ('owner','admin','member')
      ))
  ) then
    raise exception 'internal tenant reviewer required' using errcode = '42501';
  end if;
  if not app_private.customer_intake_tenant_account_active(p_tenant_id) then
    raise exception 'active tenant account required' using errcode = '42501';
  end if;
  if p_status = 'edited' and (p_corrected_payload is null or jsonb_typeof(p_corrected_payload) <> 'object') then
    raise exception 'edited review requires an object' using errcode = '22023';
  end if;

  select * into original from public.ai_analysis a
    where a.id = p_analysis_id and a.tenant_id = p_tenant_id for update;
  if not found then
    raise exception 'analysis not found' using errcode = 'P0002';
  end if;
  stamp := clock_timestamp();
  original_snapshot := jsonb_build_object(
    'stage', original.stage, 'completion_percent', original.completion_percent,
    'risk_level', original.risk_level, 'detected_issues', coalesce(original.detected_issues,'{}'::text[]),
    'recommendations', coalesce(original.recommendations,'{}'::text[]), 'frame_count', original.frame_count
  );
  reviewed := original;
  if p_status = 'edited' then
    if jsonb_typeof(p_corrected_payload->'stage') = 'string' then
      reviewed.stage := left(p_corrected_payload->>'stage',200);
    end if;
    if jsonb_typeof(p_corrected_payload->'completion_percent') = 'number' then
      reviewed.completion_percent := greatest(0,least(100,trunc((p_corrected_payload->>'completion_percent')::numeric)))::integer;
    end if;
    if jsonb_typeof(p_corrected_payload->'risk_level') = 'string' then
      reviewed.risk_level := left(p_corrected_payload->>'risk_level',40);
    end if;
    if jsonb_typeof(p_corrected_payload->'detected_issues') = 'array' then
      reviewed.detected_issues := array(
        select v #>> '{}' from jsonb_array_elements(p_corrected_payload->'detected_issues') with ordinality e(v,n)
        where jsonb_typeof(v) = 'string' order by n limit 64
      );
    end if;
    if jsonb_typeof(p_corrected_payload->'recommendations') = 'array' then
      reviewed.recommendations := array(
        select v #>> '{}' from jsonb_array_elements(p_corrected_payload->'recommendations') with ordinality e(v,n)
        where jsonb_typeof(v) = 'string' order by n limit 64
      );
    end if;
    corrected_snapshot := jsonb_build_object(
      'stage', reviewed.stage, 'completion_percent', reviewed.completion_percent,
      'risk_level', reviewed.risk_level, 'detected_issues', coalesce(reviewed.detected_issues,'{}'::text[]),
      'recommendations', coalesce(reviewed.recommendations,'{}'::text[])
    );
  end if;

  update public.ai_analysis a set
    review_status = p_status, reviewed_at = stamp, reviewed_by = p_reviewer_user_id,
    review_note = left(nullif(btrim(p_note),''),2000),
    stage = reviewed.stage, completion_percent = reviewed.completion_percent,
    risk_level = reviewed.risk_level, detected_issues = reviewed.detected_issues,
    recommendations = reviewed.recommendations
  where a.id = original.id and a.tenant_id = p_tenant_id returning * into reviewed;
  if not found then
    raise exception 'review update was not recorded' using errcode = 'P0001';
  end if;

  -- Any constraint/trigger/insert error rolls back the preceding UPDATE as well.
  insert into public.ai_analysis_corrections(
    tenant_id,analysis_id,verdict,original_snapshot,corrected_payload,reason,reviewer_user_id,created_at
  ) values (
    p_tenant_id,original.id,p_status,original_snapshot,corrected_snapshot,
    reviewed.review_note,p_reviewer_user_id,stamp
  ) returning id into correction_id;
  if correction_id is null then
    raise exception 'correction was not recorded' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'id',reviewed.id,'media_id',reviewed.media_id,'review_status',reviewed.review_status,
    'reviewed_at',reviewed.reviewed_at,'reviewed_by',reviewed.reviewed_by,'correction_id',correction_id
  );
end;
$$;
revoke all on function public.review_ai_analysis_atomic(uuid,uuid,uuid,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.review_ai_analysis_atomic(uuid,uuid,uuid,text,text,jsonb) to service_role;
