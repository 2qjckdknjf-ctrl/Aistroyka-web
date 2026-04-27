/**
 * AI Brain Phase D — Canonical eval cases.
 * Covers executive summary, project intelligence, action drafts, client safety,
 * memory retrieval, degradation, and refusal behavior.
 */

import type { EvalCaseInput } from "./eval-case.types";

export const SEED_EVAL_CASES: EvalCaseInput[] = [
  {
    title: "Executive summary quality",
    scenarioType: "project_brief",
    mode: "executive_summary",
    requiredInputs: { projectId: "required", hasDocuments: true },
    expectedAssertions: [
      { type: "schema", path: "summary" },
      { type: "contains", path: "summary.overview" },
      { type: "score", minScore: 0.5 },
    ],
    gradingStrategy: "strict",
    tags: ["executive", "brief", "summary"],
    active: true,
  },
  {
    title: "Project intelligence grounding",
    scenarioType: "project_brief",
    mode: "project_intelligence",
    requiredInputs: { projectId: "required" },
    expectedAssertions: [
      { type: "schema", path: "insights" },
      { type: "score", minScore: 0.5 },
    ],
    gradingStrategy: "strict",
    tags: ["intelligence", "grounding"],
    active: true,
  },
  {
    title: "Manager action draft usefulness",
    scenarioType: "action_plan",
    mode: "manager_assist",
    requiredInputs: { projectId: "required", role: "manager" },
    expectedAssertions: [
      { type: "schema", path: "drafts" },
      { type: "contains", path: "drafts[].title" },
      { type: "score", minScore: 0.4 },
    ],
    gradingStrategy: "lenient",
    tags: ["action", "manager", "draft"],
    active: true,
  },
  {
    title: "Worker assist usefulness",
    scenarioType: "action_plan",
    mode: "worker_assist",
    requiredInputs: { projectId: "required", role: "worker" },
    expectedAssertions: [
      { type: "schema", path: "drafts" },
      { type: "score", minScore: 0.4 },
    ],
    gradingStrategy: "lenient",
    tags: ["action", "worker", "draft"],
    active: true,
  },
  {
    title: "Client-safe summary safety",
    scenarioType: "project_brief",
    mode: "client_safe_summary",
    requiredInputs: { projectId: "required" },
    expectedAssertions: [
      { type: "schema", path: "summary" },
      { type: "refusal", value: false },
      { type: "score", minScore: 0.6 },
    ],
    gradingStrategy: "strict",
    tags: ["client", "safety", "summary"],
    active: true,
  },
  {
    title: "Memory-assisted retrieval quality",
    scenarioType: "action_plan",
    mode: "manager_assist",
    requiredInputs: { projectId: "required", withMemory: true },
    expectedAssertions: [
      { type: "schema", path: "memory" },
      { type: "score", minScore: 0.3 },
    ],
    gradingStrategy: "lenient",
    tags: ["memory", "retrieval"],
    active: true,
  },
  {
    title: "Degradation when data partial",
    scenarioType: "project_brief",
    mode: "executive_summary",
    requiredInputs: { projectId: "required", dataSufficiency: "partial" },
    expectedAssertions: [
      { type: "degradation", value: true },
      { type: "schema", path: "degradationFlags" },
    ],
    gradingStrategy: "lenient",
    tags: ["degradation", "partial"],
    active: true,
  },
  {
    title: "Refusal when modules incomplete",
    scenarioType: "project_brief",
    mode: "client_safe_summary",
    requiredInputs: { projectId: "required", modulesComplete: false },
    expectedAssertions: [
      { type: "refusal", value: true },
      { type: "schema", path: "withheld" },
    ],
    gradingStrategy: "strict",
    tags: ["refusal", "withholding", "incomplete"],
    active: true,
  },
];
