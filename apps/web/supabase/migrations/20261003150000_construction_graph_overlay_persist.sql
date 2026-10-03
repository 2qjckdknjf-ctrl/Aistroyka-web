-- Overlay write policies + provenance timestamps (SOT payloads stay in source tables).

alter table public.construction_graph_nodes
  add column if not exists source_type text;

update public.construction_graph_nodes
  set source_type = source_table
  where source_type is null;

alter table public.construction_graph_nodes
  alter column source_type set default '';

alter table public.construction_graph_nodes
  add column if not exists updated_at timestamptz not null default now();

alter table public.construction_graph_edges
  add column if not exists updated_at timestamptz not null default now();

drop policy if exists construction_graph_nodes_write on public.construction_graph_nodes;
create policy construction_graph_nodes_write on public.construction_graph_nodes
  for insert with check (public.can_read_project_membership(tenant_id, project_id));

drop policy if exists construction_graph_nodes_update on public.construction_graph_nodes;
create policy construction_graph_nodes_update on public.construction_graph_nodes
  for update using (public.can_read_project_membership(tenant_id, project_id))
  with check (public.can_read_project_membership(tenant_id, project_id));

drop policy if exists construction_graph_edges_write on public.construction_graph_edges;
create policy construction_graph_edges_write on public.construction_graph_edges
  for insert with check (public.can_read_project_membership(tenant_id, project_id));

drop policy if exists construction_graph_edges_delete on public.construction_graph_edges;
create policy construction_graph_edges_delete on public.construction_graph_edges
  for delete using (public.can_read_project_membership(tenant_id, project_id));
