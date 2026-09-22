-- public.media / analysis_jobs / ai_analysis used bare tenant_members (any role),
-- so portal stakeholders (tenant_members.role = 'stakeholder') had FOR ALL access
-- via PostgREST: read/update/delete every media row and analysis job in the tenant.
--
-- Align with Wave 4 stakeholder isolation:
-- - writes: internal tenant readers only
-- - media SELECT: internal readers, or active portal stakeholder for that project
-- - analysis_jobs / ai_analysis: internal readers only (no portal product surface)

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
drop policy if exists "media_tenant" on public.media;
drop policy if exists media_select_internal on public.media;
drop policy if exists media_select_portal on public.media;
drop policy if exists media_insert_internal on public.media;
drop policy if exists media_update_internal on public.media;
drop policy if exists media_delete_internal on public.media;

create policy media_select_internal on public.media
  for select to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy media_select_portal on public.media
  for select to authenticated
  using (
    project_id is not null
    and public.is_portal_stakeholder_for_project(project_id)
  );

create policy media_insert_internal on public.media
  for insert to authenticated
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy media_update_internal on public.media
  for update to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy media_delete_internal on public.media
  for delete to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- analysis_jobs
-- ---------------------------------------------------------------------------
drop policy if exists "analysis_jobs_tenant" on public.analysis_jobs;
drop policy if exists analysis_jobs_select_internal on public.analysis_jobs;
drop policy if exists analysis_jobs_insert_internal on public.analysis_jobs;
drop policy if exists analysis_jobs_update_internal on public.analysis_jobs;
drop policy if exists analysis_jobs_delete_internal on public.analysis_jobs;

create policy analysis_jobs_select_internal on public.analysis_jobs
  for select to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy analysis_jobs_insert_internal on public.analysis_jobs
  for insert to authenticated
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy analysis_jobs_update_internal on public.analysis_jobs
  for update to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id))
  with check (public.is_internal_tenant_reader_for_tenant(tenant_id));

create policy analysis_jobs_delete_internal on public.analysis_jobs
  for delete to authenticated
  using (public.is_internal_tenant_reader_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- ai_analysis (scoped through media.tenant_id)
-- ---------------------------------------------------------------------------
drop policy if exists "ai_analysis_tenant" on public.ai_analysis;
drop policy if exists ai_analysis_select_internal on public.ai_analysis;
drop policy if exists ai_analysis_insert_internal on public.ai_analysis;
drop policy if exists ai_analysis_update_internal on public.ai_analysis;
drop policy if exists ai_analysis_delete_internal on public.ai_analysis;

create policy ai_analysis_select_internal on public.ai_analysis
  for select to authenticated
  using (
    media_id in (
      select m.id
      from public.media m
      where public.is_internal_tenant_reader_for_tenant(m.tenant_id)
    )
  );

create policy ai_analysis_insert_internal on public.ai_analysis
  for insert to authenticated
  with check (
    media_id in (
      select m.id
      from public.media m
      where public.is_internal_tenant_reader_for_tenant(m.tenant_id)
    )
  );

create policy ai_analysis_update_internal on public.ai_analysis
  for update to authenticated
  using (
    media_id in (
      select m.id
      from public.media m
      where public.is_internal_tenant_reader_for_tenant(m.tenant_id)
    )
  )
  with check (
    media_id in (
      select m.id
      from public.media m
      where public.is_internal_tenant_reader_for_tenant(m.tenant_id)
    )
  );

create policy ai_analysis_delete_internal on public.ai_analysis
  for delete to authenticated
  using (
    media_id in (
      select m.id
      from public.media m
      where public.is_internal_tenant_reader_for_tenant(m.tenant_id)
    )
  );
