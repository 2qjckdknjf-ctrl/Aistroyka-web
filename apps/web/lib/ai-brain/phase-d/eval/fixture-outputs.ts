/**
 * AI Brain Phase D — Fixture outputs for offline eval grading.
 * Used when live AI routes are unavailable.
 */

export const FIXTURE_OUTPUTS: Record<string, unknown> = {
  "Executive summary quality": {
    summary: { overview: "Fixture project overview", risks: [], status: "active" },
    degradationFlags: [],
  },
  "Project intelligence grounding": {
    insights: [{ title: "Fixture insight", confidence: 0.8 }],
    degradationFlags: [],
  },
  "Manager action draft usefulness": {
    drafts: [{ title: "Fixture action", priority: "high" }],
    degraded: false,
  },
  "Worker assist usefulness": {
    drafts: [{ title: "Fixture worker action" }],
    degraded: false,
  },
  "Client-safe summary safety": {
    summary: { overview: "Safe overview" },
    withheld: false,
    degradationFlags: [],
  },
  "Memory-assisted retrieval quality": {
    drafts: [],
    memory: [{ memoryId: "fixture-1", confidence: 0.7 }],
    degraded: false,
  },
  "Degradation when data partial": {
    summary: null,
    degradationFlags: ["partial_data"],
  },
  "Refusal when modules incomplete": {
    withheld: true,
    summary: null,
  },
};
