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

function takeFamilyBalancedNodes<T extends { id: string; family: string }>(
  nodes: readonly T[],
  maxNodes: number
): T[] {
  if (nodes.length <= maxNodes) {
    return nodes.slice();
  }

  const byFamily = new Map<string, T[]>();
  for (const node of nodes) {
    const bucket = byFamily.get(node.family);
    if (bucket) {
      bucket.push(node);
    } else {
      byFamily.set(node.family, [node]);
    }
  }

  const picked: T[] = [];
  const offset = new Map<string, number>();
  let addedInPass = true;
  while (picked.length < maxNodes && addedInPass) {
    addedInPass = false;
    for (const [family, bucket] of byFamily) {
      if (picked.length >= maxNodes) {
        break;
      }
      const i = offset.get(family) ?? 0;
      if (i < bucket.length) {
        picked.push(bucket[i]);
        offset.set(family, i + 1);
        addedInPass = true;
      }
    }
  }

  const originalIndex = new Map(nodes.map((node, index) => [node.id, index]));
  picked.sort((a, b) => (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0));
  return picked;
}

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

  const nodes = takeFamilyBalancedNodes(graph.nodes, maxNodes).map((n) => ({
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
