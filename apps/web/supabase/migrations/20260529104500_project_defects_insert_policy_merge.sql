-- Merge overlapping INSERT policies on project_defects (portal + internal).

drop policy if exists project_defects_insert_portal on public.project_defects;
drop policy if exists project_defects_write_internal_insert on public.project_defects;

create policy project_defects_insert on public.project_defects
  for insert
  with check (
    is_internal_tenant_reader_for_tenant(tenant_id)
    or (
      is_portal_stakeholder_for_project(project_id)
      and created_by = (select auth.uid())
      and status = 'open'::text
      and assigned_to is null
    )
  );
