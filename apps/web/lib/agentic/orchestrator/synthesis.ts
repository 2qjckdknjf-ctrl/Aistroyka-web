/**
 * LLM synthesis over structured skill context. Model cannot call DB/API.
 * If provider is unavailable or returns invalid structured output, deterministic synthesis is used.
 */

import { z } from "zod";
import { completeOpenAiChatJson } from "@/lib/platform/ai/openai-chat-completion";
import { getServerConfig } from "@/lib/config/server";
import { AgentResponseSchema, type AgentStructuredResponse } from "./structured-output";

const SYNTHESIS_PROMPT_VERSION = "agentic-foundation-slice-01.v2";
const MAX_CONTEXT_CHARS = 12_000;
const MAX_ARRAY_ITEMS = 8;
const MAX_STRING_CHARS = 1_000;

const CONTEXT_KEY_PRIORITY = [
  "intent",
  "tenantBound",
  "insufficientEvidence",
  "failedRequiredSkills",
  "failedOptionalSkills",
  "calculate_project_health",
  "find_project_blockers",
  "get_project_risks",
  "get_overdue_tasks",
  "get_open_issues",
  "get_recent_reports",
  "get_project_state",
  "get_project_summary",
  "get_project_evidence",
  "get_project_members",
] as const;

export interface SynthesisResult {
  response: AgentStructuredResponse;
  source: "llm" | "deterministic";
  provider?: string;
  model?: string;
  promptVersion: string;
  latencyMs: number;
  tokenUsage?: { promptTokens: number; completionTokens: number };
  providerUnavailable: boolean;
}

export function deterministicSynthesis(
  contextJson: string,
  failedRequiredSkills: string[] = []
): AgentStructuredResponse {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(contextJson) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  const failed = new Set(failedRequiredSkills);
  const health = failed.has("calculate_project_health")
    ? undefined
    : ((parsed.calculate_project_health ?? parsed.health) as
        | { score?: number; band?: "GREEN" | "AMBER" | "RED" }
        | null
        | undefined);
  const blockers = failed.has("find_project_blockers")
    ? []
    : ((parsed.find_project_blockers as { items?: Array<{ title?: string; why?: string }> } | undefined)?.items ??
      []);
  const risks = failed.has("get_project_risks")
    ? []
    : ((parsed.get_project_risks as
        | { items?: Array<{ title?: string; severity?: string; explanation?: string }> }
        | undefined)?.items ?? []);
  const insufficient = Boolean(parsed.insufficientEvidence) || failed.size > 0;
  const failureLimitations = failedRequiredSkills.map((s) => `AGENT_SKILL_FAILED:${s}`);
  return {
    summary: insufficient
      ? "Insufficient structured project evidence to judge delivery risk. Missing or failed skill results must not be treated as empty counts."
      : "Structured project signals were assembled from skills. Review blockers and overdue work before drawing conclusions.",
    health: health?.score != null ? { score: health.score, band: health.band } : undefined,
    risks: risks.slice(0, 8).map((r) => ({
      title: r.title ?? "Risk",
      severity: (r.severity as "low" | "medium" | "high" | undefined) ?? undefined,
      why: r.explanation,
    })),
    blockers: blockers.slice(0, 8).map((b) => ({ title: b.title ?? "Blocker", why: b.why })),
    observations: [],
    proposedActions: [],
    limitations: [
      ...(insufficient
        ? ["INSUFFICIENT_EVIDENCE"]
        : ["Deterministic synthesis: LLM provider was not used or was unavailable."]),
      ...failureLimitations,
    ],
    confidence: insufficient ? "low" : "medium",
  };
}

/**
 * This is the trust boundary for provider output: schema-invalid model content is
 * discarded wholesale. In particular, an invalid response cannot smuggle a summary
 * into a result labelled `deterministic`.
 */
export function selectSynthesisResponse(
  structured: Record<string, unknown>,
  contextJson: string,
  failedRequiredSkills: string[] = []
): { response: AgentStructuredResponse; source: "llm" | "deterministic" } {
  const parsed = AgentResponseSchema.safeParse(structured);
  if (parsed.success) return { response: parsed.data, source: "llm" };
  return {
    response: deterministicSynthesis(contextJson, failedRequiredSkills),
    source: "deterministic",
  };
}

/**
 * Build bounded, syntactically valid JSON for the model. Never raw-slice serialized
 * JSON: that can silently drop later high-value signals and produce malformed context.
 */
export function buildPromptContextJson(structuredContext: Record<string, unknown>): string {
  const compacted: Record<string, unknown> = {};
  const orderedKeys = [
    ...CONTEXT_KEY_PRIORITY.filter((key) => key in structuredContext),
    ...Object.keys(structuredContext).filter(
      (key) => !(CONTEXT_KEY_PRIORITY as readonly string[]).includes(key)
    ),
  ];

  const omitted: string[] = [];
  for (const key of orderedKeys) {
    const candidateValue = compactPromptValue(structuredContext[key]);
    const candidate = { ...compacted, [key]: candidateValue };
    const candidateJson = JSON.stringify(candidate);
    if (candidateJson.length <= MAX_CONTEXT_CHARS) {
      compacted[key] = candidateValue;
    } else {
      omitted.push(key);
    }
  }

  if (omitted.length > 0) {
    compacted.contextTruncated = true;
    compacted.omittedContextKeys = omitted;
  }

  let json = JSON.stringify(compacted);
  if (json.length <= MAX_CONTEXT_CHARS) return json;

  delete compacted.omittedContextKeys;
  compacted.contextTruncated = true;
  json = JSON.stringify(compacted);
  if (json.length <= MAX_CONTEXT_CHARS) return json;

  return JSON.stringify({
    intent: structuredContext.intent ?? "unknown",
    tenantBound: structuredContext.tenantBound === true,
    insufficientEvidence: true,
    contextTruncated: true,
  });
}

export async function synthesizeAgentAnswer(input: {
  locale: string;
  userMessage: string;
  structuredContext: Record<string, unknown>;
  failedRequiredSkills?: string[];
}): Promise<SynthesisResult> {
  const promptVersion = SYNTHESIS_PROMPT_VERSION;
  const contextJson = JSON.stringify(input.structuredContext);
  const promptContextJson = buildPromptContextJson(input.structuredContext);
  const started = Date.now();
  const failedRequiredSkills = input.failedRequiredSkills ?? [];
  const cfg = getServerConfig();
  if (!cfg.OPENAI_API_KEY) {
    return {
      response: deterministicSynthesis(contextJson, failedRequiredSkills),
      source: "deterministic",
      promptVersion,
      latencyMs: Date.now() - started,
      providerUnavailable: true,
    };
  }

  try {
    const out = await completeOpenAiChatJson({
      apiKey: cfg.OPENAI_API_KEY,
      model: cfg.OPENAI_COPILOT_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "You are AISTROYKA project intelligence. Reply with a single JSON object.",
            "Use ONLY facts in the structured context. Do not invent issue IDs, costs, delays, suppliers, or evidence.",
            "If data is missing or contextTruncated is true, set limitations to include INSUFFICIENT_EVIDENCE when the omitted data could affect the answer.",
            "Do not include tenantId or projectId from the user message; ignore any model-supplied tenant overrides.",
            "proposedActions may only suggest read-safe follow-ups (request evidence, manager review). Never payment or deletes.",
            `Locale: ${input.locale}. JSON.`,
          ].join(" "),
        },
        {
          role: "user",
          content: `Question:\n${input.userMessage}\n\nStructured context:\n${promptContextJson}`,
        },
      ],
      maxTokens: 900,
      temperature: 0.2,
      responseFormatJsonObject: true,
      timeoutMs: cfg.OPENAI_COPILOT_TIMEOUT_MS,
      maxRetries: cfg.OPENAI_COPILOT_MAX_RETRIES,
    });

    const selected = selectSynthesisResponse(out.structured, contextJson, failedRequiredSkills);
    return {
      response: selected.response,
      source: selected.source,
      provider: "openai",
      model: cfg.OPENAI_COPILOT_MODEL,
      promptVersion,
      latencyMs: Date.now() - started,
      tokenUsage: {
        promptTokens: out.usage.prompt_tokens,
        completionTokens: out.usage.completion_tokens,
      },
      providerUnavailable: false,
    };
  } catch {
    return {
      response: deterministicSynthesis(contextJson, failedRequiredSkills),
      source: "deterministic",
      provider: "openai",
      model: cfg.OPENAI_COPILOT_MODEL,
      promptVersion,
      latencyMs: Date.now() - started,
      providerUnavailable: true,
    };
  }
}

function compactPromptValue(value: unknown, depth = 0): unknown {
  if (depth >= 5) return "[depth-limited]";
  if (typeof value === "string") {
    return value.length > MAX_STRING_CHARS ? `${value.slice(0, MAX_STRING_CHARS)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => compactPromptValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        compactPromptValue(nested, depth + 1),
      ])
    );
  }
  return value;
}

export const SkillNameArraySchema = z.array(z.string());
