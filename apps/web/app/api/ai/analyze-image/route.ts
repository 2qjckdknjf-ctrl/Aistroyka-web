/**
 * In-app AI analysis endpoint (construction site image → structured result).
 *
 * Contract:
 * - Request: POST JSON { image_url (required), media_id?, project_id? }.
 * - Response: 200 with AnalysisResult { stage, completion_percent, risk_level, detected_issues, recommendations }.
 * - Errors: 400 (bad body), 413 (body too large), 502/504 (OpenAI), 503 (no OPENAI_API_KEY).
 *
 * Used when AI_ANALYSIS_URL points to this app (unified web + iOS). Prompt: @/lib/ai/prompts.
 */

import { NextResponse } from "next/server";
import {
  CONSTRUCTION_VISION_SYSTEM_PROMPT,
  CONSTRUCTION_VISION_USER_MESSAGE,
} from "@/lib/ai/prompts";
import {
  normalizeStage,
  parseJsonFromContent,
  sanitizeAnalysisResult,
} from "@/lib/ai/normalize";
import { calibrateRiskLevel } from "@/lib/ai/riskCalibration";
import { type AnalysisResult, type RiskLevel } from "@/lib/ai/types";

const MODEL = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o";
const OPENAI_TIMEOUT_MS = Math.min(
  120_000,
  Math.max(30_000, Number(process.env.OPENAI_VISION_TIMEOUT_MS) || 85_000)
);
const OPENAI_RETRY_ON_5XX = Math.min(3, Math.max(0, Number(process.env.OPENAI_RETRY_ON_5XX) ?? 1));

function parseRiskLevel(s: string): RiskLevel {
  const v = s?.toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_BODY_BYTES = 100_000;

/** Single JSON log line for aggregators (CloudWatch, Datadog, etc.). No PII. */
function logAiEvent(payload: {
  status: "success" | "failure";
  duration_ms: number;
  stage?: string;
  risk_level?: string;
  completion_percent?: number;
  issues_count?: number;
  error?: string;
  http_status?: number;
}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(
    JSON.stringify({
      event: "ai_analyze_image",
      ...payload,
      ts: new Date().toISOString(),
    })
  );
}

function validateImageUrl(
  url: string
): { ok: true } | { ok: false; error: string } {
  if (url.length > MAX_IMAGE_URL_LENGTH) {
    return { ok: false, error: "image_url too long" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "image_url must be a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "image_url must be http or https" };
  }
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    return { ok: false, error: "image_url must be https in production" };
  }
  return { ok: true };
}

function normalizeToAnalysisResult(raw: Record<string, unknown>): AnalysisResult {
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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    contentLength !== "" &&
    Number(contentLength) > MAX_BODY_BYTES
  ) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  let body: { media_id?: string; image_url?: string; project_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const imageUrl =
    typeof body.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl) {
    return NextResponse.json(
      { error: "image_url is required" },
      { status: 400 }
    );
  }

  const urlCheck = validateImageUrl(imageUrl);
  if (!urlCheck.ok) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
  }

  const startMs = Date.now();

  try {
  const payload = {
    model: MODEL,
    response_format: { type: "json_object" as const },
    max_tokens: 1024,
    temperature: 0,
    messages: [
      { role: "system" as const, content: CONSTRUCTION_VISION_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: CONSTRUCTION_VISION_USER_MESSAGE,
          },
          {
            type: "image_url" as const,
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  };

  let res: Response | null = null;
  let lastErrText = "";
  let successData: { choices?: Array<{ message?: { content?: string } }> } | null = null;

  for (let attempt = 0; attempt <= OPENAI_RETRY_ON_5XX; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        successData = (await res.json()) as typeof successData;
        break;
      }
      lastErrText = await res.text();
      if (res.status < 500 || attempt === OPENAI_RETRY_ON_5XX) {
        if (process.env.NODE_ENV !== "test") {
          console.warn("[ai] analyze-image OpenAI error", { status: res.status, duration_ms: Date.now() - startMs });
        }
        return NextResponse.json(
          { error: `OpenAI API error: ${res.status} ${lastErrText}` },
          { status: 502 }
        );
      }
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === "AbortError") {
        logAiEvent({
          status: "failure",
          duration_ms: Date.now() - startMs,
          error: "timeout",
          http_status: 504,
        });
        return NextResponse.json(
          { error: "OpenAI request timed out" },
          { status: 504 }
        );
      }
      throw e;
    }
  }

  if (!successData) {
    logAiEvent({
      status: "failure",
      duration_ms: Date.now() - startMs,
      error: "OpenAI no data",
      http_status: 502,
    });
    return NextResponse.json(
      { error: `OpenAI API error: ${res?.status ?? 502} ${lastErrText}` },
      { status: 502 }
    );
  }

  const data: { choices?: Array<{ message?: { content?: string } }> } = successData;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    logAiEvent({
      status: "failure",
      duration_ms: Date.now() - startMs,
      error: "Empty response from AI",
      http_status: 502,
    });
    return NextResponse.json(
      { error: "Empty response from AI" },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFromContent(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI returned non-JSON";
    logAiEvent({
      status: "failure",
      duration_ms: Date.now() - startMs,
      error: msg,
      http_status: 502,
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const raw = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  let result = normalizeToAnalysisResult(raw);
  result = sanitizeAnalysisResult(result);
  result = { ...result, risk_level: calibrateRiskLevel(result) };

  const durationMs = Date.now() - startMs;
  logAiEvent({
    status: "success",
    duration_ms: durationMs,
    stage: result.stage,
    risk_level: result.risk_level,
    completion_percent: result.completion_percent,
    issues_count: result.detected_issues.length,
  });
  const response = NextResponse.json(result);
  response.headers.set("X-AI-Duration-Ms", String(durationMs));
  return response;
  } catch (err) {
    const durationMs = Date.now() - startMs;
    const message = err instanceof Error ? err.message : "Analysis failed";
    logAiEvent({
      status: "failure",
      duration_ms: durationMs,
      error: message,
      http_status: 500,
    });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
