-- Scope overlay nodes per project and make edge replace idempotent.

alter table public.construction_graph_nodes
  drop constraint if exists construction_graph_nodes_tenant_id_source_table_source_id_key;

alter table public.construction_graph_nodes
  drop constraint if exists construction_graph_nodes_tenant_project_source_key;

alter table public.construction_graph_nodes
  add constraint construction_graph_nodes_tenant_project_source_key
  unique (tenant_id, project_id, source_table, source_id);

alter table public.construction_graph_edges
  drop constraint if exists construction_graph_edges_tenant_project_rel_key;

alter table public.construction_graph_edges
  add constraint construction_graph_edges_tenant_project_rel_key
  unique (tenant_id, project_id, kind, from_node_id, to_node_id);

drop policy if exists construction_graph_edges_update on public.construction_graph_edges;
create policy construction_graph_edges_update on public.construction_graph_edges
  for update using (public.can_read_project_membership(tenant_id, project_id))
  with check (public.can_read_project_membership(tenant_id, project_id));
