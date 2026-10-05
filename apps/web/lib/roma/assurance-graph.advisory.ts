export type AssuranceEnvironment = "local" | "staging" | "preprod" | "production";

export type AssuranceVerdictStatus = "PASS" | "FAIL" | "INCOMPLETE" | "STALE";

export type AssuranceGraphNode = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export type AssuranceGraph = {
  schema_version: string;
  graph_id: string;
  requirement_id: string;
  requirement_revision: string;
  commit_sha: string;
  environment: AssuranceEnvironment;
  generated_at: string;
  tool_version: string;
  origin: string;
  nodes: AssuranceGraphNode[];
  edges: { from: string; to: string }[];
};

export type AssuranceEvalContext = {
  commitSha: string;
  environment: AssuranceEnvironment;
};

const ROOT_REQUIRED = [
  "schema_version",
  "graph_id",
  "requirement_id",
  "requirement_revision",
  "commit_sha",
  "environment",
  "generated_at",
  "tool_version",
  "origin",
  "nodes",
  "edges",
] as const;

const NODE_TYPES = new Set([
  "requirement",
  "acceptance_criterion",
  "verification_contract",
  "observation",
  "evidence",
  "verifier",
  "verdict",
]);

export function parseAssuranceGraph(raw: unknown): { graph: AssuranceGraph } | { error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "graph must be an object" };
  }
  const obj = raw as Record<string, unknown>;
  for (const key of ROOT_REQUIRED) {
    if (!(key in obj)) return { error: `missing ${key}` };
  }
  if (obj.schema_version !== "ag_v1") return { error: "schema_version must be ag_v1" };
  if (typeof obj.commit_sha !== "string" || obj.commit_sha.length < 7) {
    return { error: "commit_sha required" };
  }
  const env = obj.environment;
  if (env !== "local" && env !== "staging" && env !== "preprod" && env !== "production") {
    return { error: "environment invalid" };
  }
  if (!Array.isArray(obj.nodes) || obj.nodes.length < 1) return { error: "nodes required" };
  if (!Array.isArray(obj.edges)) return { error: "edges required" };
  for (const node of obj.nodes) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return { error: "node invalid" };
    const n = node as Record<string, unknown>;
    if (typeof n.id !== "string" || !n.id) return { error: "node.id required" };
    if (typeof n.type !== "string" || !NODE_TYPES.has(n.type)) return { error: "node.type invalid" };
  }
  for (const edge of obj.edges) {
    if (!edge || typeof edge !== "object" || Array.isArray(edge)) return { error: "edge invalid" };
    const e = edge as Record<string, unknown>;
    if (typeof e.from !== "string" || typeof e.to !== "string") return { error: "edge endpoints required" };
  }
  return { graph: obj as AssuranceGraph };
}

export function evaluateAssuranceGraph(
  graph: AssuranceGraph,
  ctx: AssuranceEvalContext
): { status: AssuranceVerdictStatus; reasons: string[] } {
  const reasons: string[] = [];
  const observations = graph.nodes.filter((n) => n.type === "observation");
  const evidence = graph.nodes.filter((n) => n.type === "evidence");
  const verifiers = graph.nodes.filter((n) => n.type === "verifier");
  const criteria = graph.nodes.filter((n) => n.type === "acceptance_criterion");

  if (criteria.length < 1) reasons.push("no acceptance criteria");
  if (!verifiers.some((v) => v.independent === true)) {
    reasons.push("no independent verifier");
  }

  for (const obs of observations) {
    if (obs.result === "missing") reasons.push(`observation ${obs.id} missing`);
    if (obs.result === "fail") reasons.push(`observation ${obs.id} failed`);
  }

  const evidencedObs = new Set(
    evidence.map((ev) => (typeof ev.observation_id === "string" ? ev.observation_id : ""))
  );
  for (const obs of observations) {
    if (!evidencedObs.has(obs.id)) reasons.push(`observation ${obs.id} has no evidence`);
  }

  for (const ev of evidence) {
    if (ev.commit_sha !== ctx.commitSha) reasons.push(`evidence ${ev.id} stale commit`);
    if (ev.environment !== ctx.environment) reasons.push(`evidence ${ev.id} stale environment`);
    for (const field of ["artifact_hash", "recorded_at", "tool_version", "origin"] as const) {
      if (typeof ev[field] !== "string" || !ev[field]) {
        reasons.push(`evidence ${ev.id} missing ${field}`);
      }
    }
  }

  if (graph.commit_sha !== ctx.commitSha) reasons.push("graph commit_sha stale");
  if (graph.environment !== ctx.environment) reasons.push("graph environment stale");

  if (reasons.some((r) => r.includes("failed"))) return { status: "FAIL", reasons };
  if (reasons.some((r) => r.includes("stale"))) return { status: "STALE", reasons };
  if (reasons.length > 0) return { status: "INCOMPLETE", reasons };
  return { status: "PASS", reasons };
}
