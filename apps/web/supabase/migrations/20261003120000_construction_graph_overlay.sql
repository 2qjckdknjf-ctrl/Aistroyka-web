-- Construction Graph overlay: references existing SOT rows; does not duplicate payloads.

create table if not exists public.construction_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  family text not null check (family in (
    'project','space','task','report','evidence','issue','decision','document','participant'
  )),
  source_table text not null,
  source_id uuid not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, source_table, source_id)
);

create table if not exists public.construction_graph_edges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null,
  from_node_id uuid not null references public.construction_graph_nodes(id) on delete cascade,
  to_node_id uuid not null references public.construction_graph_nodes(id) on delete cascade,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cgn_project on public.construction_graph_nodes (tenant_id, project_id);
create index if not exists idx_cge_project on public.construction_graph_edges (tenant_id, project_id);

alter table public.construction_graph_nodes enable row level security;
alter table public.construction_graph_edges enable row level security;

drop policy if exists construction_graph_nodes_read on public.construction_graph_nodes;
create policy construction_graph_nodes_read on public.construction_graph_nodes
  for select using (public.can_read_project_membership(tenant_id, project_id));

drop policy if exists construction_graph_edges_read on public.construction_graph_edges;
create policy construction_graph_edges_read on public.construction_graph_edges
  for select using (public.can_read_project_membership(tenant_id, project_id));
