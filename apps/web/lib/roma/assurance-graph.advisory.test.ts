import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  evaluateAssuranceGraph,
  parseAssuranceGraph,
  type AssuranceGraph,
} from "./assurance-graph.advisory";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const fixturePath = join(
  repoRoot,
  "docs/roma/fixtures/assurance_graph.REQ-AUTH-PROJECT-001.json"
);

function loadFixture(): AssuranceGraph {
  const parsed = parseAssuranceGraph(JSON.parse(readFileSync(fixturePath, "utf8")));
  if ("error" in parsed) throw new Error(parsed.error);
  return parsed.graph;
}

describe("ROMA-VER-009 assurance graph (advisory)", () => {
  it("parses the REQ-AUTH-PROJECT-001 fixture", () => {
    const graph = loadFixture();
    expect(graph.requirement_id).toBe("REQ-AUTH-PROJECT-001");
    expect(graph.nodes.filter((n) => n.type === "acceptance_criterion")).toHaveLength(2);
  });

  it("does not PASS when an observation is missing", () => {
    const graph = loadFixture();
    const nodes = graph.nodes.map((n) =>
      n.id === "OBS-FOREIGN-PROJECT" ? { ...n, result: "missing" } : n
    );
    const verdict = evaluateAssuranceGraph(
      { ...graph, nodes },
      { commitSha: graph.commit_sha, environment: graph.environment }
    );
    expect(verdict.status).toBe("INCOMPLETE");
  });

  it("marks evidence STALE when the commit SHA changes", () => {
    const graph = loadFixture();
    const verdict = evaluateAssuranceGraph(graph, {
      commitSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      environment: graph.environment,
    });
    expect(verdict.status).toBe("STALE");
    expect(verdict.reasons.some((r) => r.includes("stale"))).toBe(true);
  });

  it("PASSes the fixture only against the recorded SHA and environment", () => {
    const graph = loadFixture();
    const verdict = evaluateAssuranceGraph(graph, {
      commitSha: graph.commit_sha,
      environment: graph.environment,
    });
    expect(verdict.status).toBe("PASS");
  });
});
