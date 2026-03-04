/**
 * Core vision analysis: OpenAI call + normalize. Used by analyze-image route and job handlers.
 * Server-only. Caller is responsible for quota/rate-limit when applicable.
 */

import {
  CONSTRUCTION_VISION_SYSTEM_PROMPT,
  CONSTRUCTION_VISION_USER_MESSAGE,
} from "./prompts";
import { parseJsonFromContent, sanitizeAnalysisResult } from "./normalize";
import { calibrateRiskLevel } from "./riskCalibration";
import type { AnalysisResult, RiskLevel } from "./types";
import { getServerConfig } from "@/lib/config/server";
import { recordUsage } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd as estimateCost } from "@/lib/platform/ai-usage/cost-estimator";

function normalizeStage(raw: string | undefined): string {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const allowed = ["unknown", "pre-construction", "earthwork", "foundation", "framing", "mep", "envelope", "finishing", "complete"];
  return s && allowed.includes(s) ? s : "unknown";
}

function parseRiskLevel(s: string): RiskLevel {
  const v = s?.toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function toAnalysisResult(raw: Record<string, unknown>): AnalysisResult {
  return {
    stage: normalizeStage(typeof raw.stage === "string" ? raw.stage : undefined),
    completion_percent:
      typeof raw.completion_percent === "number"
        ? Math.min(100, Math.max(0, Math.round(raw.completion_percent)))
        : 0,
    risk_level: parseRiskLevel(String(raw.risk_level ?? "medium")),
    detected_issues: Array.isArray(raw.detected_issues)
      ? (raw.detected_issues as unknown[]).filter((i) => typeof i === "string")
      : [],
    recommendations: Array.isArray(raw.recommendations)
      ? (raw.recommendations as unknown[]).filter((r) => typeof r === "string")
      : [],
  };
}

export interface RunVisionOptions {
  tenantId?: string | null;
  userId?: string | null;
  traceId?: string | null;
  recordUsageWithAdmin?: import("@supabase/supabase-js").SupabaseClient | null;
}

/**
 * Run construction vision analysis on an image URL. Returns result or throws.
 */
export async function runVisionAnalysis(
  imageUrl: string,
  options: RunVisionOptions = {}
): Promise<AnalysisResult> {
  const startMs = Date.now();
  const config = getServerConfig();
  const apiKey = config.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = config.OPENAI_VISION_MODEL || "gpt-4o";
  const timeoutMs = config.OPENAI_VISION_TIMEOUT_MS ?? 85_000;
  const retries = config.OPENAI_RETRY_ON_5XX ?? 1;

  const payload = {
    model,
    response_format: { type: "json_object" as const },
    max_tokens: 1024,
    temperature: 0,
    messages: [
      { role: "system" as const, content: CONSTRUCTION_VISION_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: CONSTRUCTION_VISION_USER_MESSAGE },
          { type: "image_url" as const, image_url: { url: imageUrl } },
        ],
      },
    ],
  };

  let lastErrText = "";
  let res: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (res.ok) break;
      lastErrText = await res.text();
      if (res.status < 500 || attempt === retries) {
        throw new Error(`OpenAI API error: ${res.status} ${lastErrText}`);
      }
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    } catch (e) {
      clearTimeout(t);
      if (e instanceof Error && e.name === "AbortError") throw new Error("OpenAI request timed out");
      throw e;
    }
  }

  if (!res?.ok) throw new Error(`OpenAI API error: ${res?.status ?? 502} ${lastErrText}`);

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from AI");

  let parsed: unknown;
  try {
    parsed = parseJsonFromContent(content);
  } catch {
    throw new Error("AI returned non-JSON");
  }
  const raw = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  let result = toAnalysisResult(raw);
  result = sanitizeAnalysisResult(result);
  result = { ...result, risk_level: calibrateRiskLevel(result) };

  const durationMs = Date.now() - startMs;
  if (options.recordUsageWithAdmin && options.tenantId) {
    const u = data.usage;
    const ti = typeof u?.prompt_tokens === "number" ? u.prompt_tokens : 500;
    const to = typeof u?.completion_tokens === "number" ? u.completion_tokens : 300;
    const cost = estimateCost(model, ti, to);
    await recordUsage(options.recordUsageWithAdmin, {
      tenant_id: options.tenantId,
      user_id: options.userId ?? null,
      trace_id: options.traceId ?? null,
      provider: "openai",
      model,
      tokens_input: ti,
      tokens_output: to,
      tokens_total: ti + to,
      cost_usd: cost,
      status: "success",
      duration_ms: durationMs,
    });
  }

  return result;
}
