import type { ConstructionGraphQuery } from "./construction-graph.model";

/** Compact, provenance-preserving projection for AI prompts — not a second SOT. */
export type ConstructionGraphAIContext = {
  project_id: string;
  tenant_id: string;
  truncated: boolean;
  summary: {
    node_count: number;
    edge_count: number;
    families: Record<string, number>;
  };
  nodes: Array<{
    id: string;
    family: string;
    label: string;
    source: { table: string; id: string };
    provenance: { kind: string; table: string; id: string };
  }>;
  edges: Array<{
    id: string;
    kind: string;
    from_id: string;
    to_id: string;
    provenance: { kind: string; table: string; column: string };
  }>;
  /** Explicit non-contractual / non-finance boundary for consumers. */
  disclaimer: "overlay_refs_only_not_contractual_truth";
};

const MAX_AI_NODES = 80;
const MAX_AI_EDGES = 120;

export function buildConstructionGraphAIContext(
  graph: ConstructionGraphQuery,
  options?: { maxNodes?: number; maxEdges?: number }
): ConstructionGraphAIContext {
  const maxNodes = options?.maxNodes ?? MAX_AI_NODES;
  const maxEdges = options?.maxEdges ?? MAX_AI_EDGES;

  const families: Record<string, number> = {};
  for (const n of graph.nodes) {
    families[n.family] = (families[n.family] ?? 0) + 1;
  }

  const nodes = graph.nodes.slice(0, maxNodes).map((n) => ({
    id: n.id,
    family: n.family,
    label: n.label,
    source: { table: n.source_table, id: n.source_id },
    provenance: { kind: n.provenance.kind, table: n.provenance.table, id: n.provenance.id },
  }));

  const keep = new Set(nodes.map((n) => n.id));
  const edges = graph.edges
    .filter((e) => keep.has(e.from_id) && keep.has(e.to_id))
    .slice(0, maxEdges)
    .map((e) => ({
      id: e.id,
      kind: e.kind,
      from_id: e.from_id,
      to_id: e.to_id,
      provenance: {
        kind: e.provenance.kind,
        table: e.provenance.table,
        column: e.provenance.column,
      },
    }));

  return {
    project_id: graph.project_id,
    tenant_id: graph.tenant_id,
    truncated: graph.truncated || graph.nodes.length > maxNodes || graph.edges.length > maxEdges,
    summary: {
      node_count: graph.nodes.length,
      edge_count: graph.edges.length,
      families,
    },
    nodes,
    edges,
    disclaimer: "overlay_refs_only_not_contractual_truth",
  };
}
