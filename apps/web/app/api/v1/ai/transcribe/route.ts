/**
 * POST /api/v1/ai/transcribe — multipart audio → text (OpenAI Whisper).
 * Tenant auth, rate limit, quota, policy, usage. Max 25 MB.
 */

import { NextResponse } from "next/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getServerConfig, isOpenAIConfigured } from "@/lib/config/server";
import { gateCopilotLlmRequest } from "@/lib/copilot/copilot-ai-gate";
import { estimateTranscriptionCostUsd, estimateTranscriptionQuotaReserveUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { recordUsage, checkBudgetAlert } from "@/lib/platform/ai-usage/ai-usage.service";
import { transcribeOpenAiAudio } from "@/lib/platform/ai/openai-transcription";
import { getOrCreateRequestId } from "@/lib/observability";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";
import { logStructured } from "@/lib/observability";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/ai/transcribe";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/flac",
  "audio/ogg",
  "application/ogg",
]);

function whisperLanguageHint(locale: string | null | undefined): string | null {
  const t = locale?.trim().toLowerCase();
  if (!t) return null;
  const m = /^([a-z]{2})(-[a-z0-9]+)?$/i.exec(t);
  return m ? m[1] : null;
}

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);
  const start = Date.now();

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "Transcription unavailable", code: "ai_provider_unavailable", request_id: requestId },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message, request_id: requestId }, { status: 401 });
    }
    throw e;
  }

  const tenantId = ctx.tenantId!;
  const userSupabase = await createClientFromRequest(request);
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "Transcription requires service configuration for usage tracking.",
        code: "ai_admin_unavailable",
        request_id: requestId,
      },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }

  const gate = await gateCopilotLlmRequest(admin, {
    tenantId,
    userId: ctx.userId ?? null,
    subscriptionTier: ctx.subscriptionTier ?? null,
    requestId,
    endpoint: ROUTE_KEY,
    request,
    estimatedCostUsd: estimateTranscriptionQuotaReserveUsd(15),
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.message, code: gate.code, request_id: requestId },
      { status: gate.httpStatus, headers: { "X-Request-Id": requestId } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data", request_id: requestId }, { status: 400 });
  }

  const fileEntry = form.get("file") ?? form.get("audio");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Missing file field (use file or audio)", request_id: requestId },
      { status: 400 }
    );
  }

  if (fileEntry.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio file too large (max 25 MB)", request_id: requestId }, { status: 413 });
  }

  const mime = (fileEntry.type ?? "").trim().toLowerCase();
  if (mime && !ALLOWED_AUDIO_TYPES.has(mime)) {
    return NextResponse.json(
      { error: `Unsupported audio type: ${mime}`, request_id: requestId },
      { status: 415 }
    );
  }

  const localeHint = whisperLanguageHint(form.get("locale")?.toString() ?? null);

  let bytes: Uint8Array;
  try {
    const buf = await fileEntry.arrayBuffer();
    bytes = new Uint8Array(buf);
  } catch {
    return NextResponse.json({ error: "Failed to read audio", request_id: requestId }, { status: 400 });
  }

  const cfg = getServerConfig();
  const model = cfg.OPENAI_TRANSCRIPTION_MODEL;

  try {
    const result = await transcribeOpenAiAudio({
      apiKey: cfg.OPENAI_API_KEY,
      model,
      audioBytes: bytes,
      filename: fileEntry.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "audio.webm",
      mimeType: mime || "audio/webm",
      language: localeHint,
      timeoutMs: cfg.OPENAI_TRANSCRIPTION_TIMEOUT_MS,
      maxRetries: cfg.OPENAI_TRANSCRIPTION_MAX_RETRIES,
    });

    const durationSec = result.durationSeconds ?? Math.max(1, fileEntry.size / 16_000);
    const costUsd = estimateTranscriptionCostUsd(model, durationSec);
    const latencyMs = Date.now() - start;

    await recordUsage(admin, {
      tenant_id: tenantId,
      user_id: ctx.userId ?? null,
      trace_id: requestId,
      provider: "openai",
      model,
      tokens_input: 0,
      tokens_output: 0,
      tokens_total: 0,
      cost_usd: costUsd,
      status: "success",
      duration_ms: latencyMs,
    });
    await checkBudgetAlert(admin, tenantId, costUsd);

    logStructured({
      event: "ai_transcription_complete",
      route: ROUTE_KEY,
      tenant_id: tenantId,
      request_id: requestId,
      duration_ms: latencyMs,
      audio_bytes: fileEntry.size,
      duration_seconds: result.durationSeconds,
    });

    void emitAiRuntimeAudit(userSupabase, {
      tenant_id: tenantId,
      user_id: ctx.userId ?? null,
      trace_id: requestId,
      action: "ai_transcription_complete",
      details: {
        request_id: requestId,
        route: ROUTE_KEY,
        latency_ms: latencyMs,
        output_type: "transcription",
        provider: "openai",
      },
    });

    return NextResponse.json(
      {
        data: {
          text: result.text,
          duration_seconds: result.durationSeconds,
          model,
        },
        request_id: requestId,
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (err) {
    const latencyMs = Date.now() - start;
    logStructured({
      event: "ai_transcription_error",
      route: ROUTE_KEY,
      tenant_id: tenantId,
      request_id: requestId,
      duration_ms: latencyMs,
      copilot_error: err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200),
    });
    void emitAiRuntimeAudit(userSupabase, {
      tenant_id: tenantId,
      user_id: ctx.userId ?? null,
      trace_id: requestId,
      action: "ai_transcription_error",
      details: {
        request_id: requestId,
        route: ROUTE_KEY,
        latency_ms: latencyMs,
        output_type: "transcription",
        provider: "openai",
        error_kind: "transcription_failed",
        retryable: true,
      },
    });
    return NextResponse.json(
      { error: "Transcription failed", request_id: requestId },
      { status: 502, headers: { "X-Request-Id": requestId } }
    );
  }
}
