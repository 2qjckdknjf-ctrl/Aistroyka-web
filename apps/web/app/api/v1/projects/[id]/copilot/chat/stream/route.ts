/**
 * POST /api/v1/projects/:id/copilot/chat/stream
 * Streaming Copilot chat. SSE events: meta, token, done, error.
 * Requires: ai_chat_threads, ai_chat_messages tables; OPENAI_API_KEY.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { getServerConfig, isOpenAIConfigured } from "@/lib/config/server";
import {
  applyContextBudget,
  DEFAULT_CONTEXT_BUDGET,
  type ChatContextInput,
} from "@/lib/copilot/context-budget";
import type { DecisionContextPayload } from "@/lib/engine/types";
import {
  logCopilotStreamComplete,
  logCopilotStreamError,
  logCopilotStreamLifecycle,
  getAiReleaseCorrelation,
} from "@/lib/observability/ai-telemetry";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

function generateRequestId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatDecisionContext(ctx: DecisionContextPayload): string {
  const parts = [
    `Overall risk: ${ctx.overall_risk}`,
    `Confidence: ${ctx.confidence}`,
    `Velocity trend: ${ctx.velocity_trend}`,
    ctx.projected_delay_date ? `Projected delay: ${ctx.projected_delay_date}` : null,
    ctx.top_risk_factors?.length
      ? `Top risks: ${ctx.top_risk_factors.map((r) => r.name).join(", ")}`
      : null,
    ctx.anomalies?.length ? `Anomalies: ${ctx.anomalies.join(", ")}` : null,
  ].filter(Boolean);
  return parts.join(". ");
}

function buildDeterministicFallbackText(
  userText: string,
  ctx: DecisionContextPayload,
  reason: string
): string {
  const riskPercent = Math.round((ctx.overall_risk ?? 0) * 100);
  const confidencePercent = Math.round((ctx.confidence ?? 0) * 100);
  const topRisk = ctx.top_risk_factors?.[0]?.name ?? null;
  const delayPart = ctx.projected_delay_date ? `Potential delay date: ${ctx.projected_delay_date}.` : "";
  const riskPart = topRisk ? `Primary risk now: ${topRisk}.` : "No single dominant risk was detected.";
  return [
    "Copilot is temporarily in fallback mode due to provider availability.",
    `Latest project signal: risk ${riskPercent}% with confidence ${confidencePercent}%.`,
    riskPart,
    delayPart,
    `Your request was: \"${userText.slice(0, 240)}\"${userText.length > 240 ? "..." : ""}.`,
    "Recommended immediate actions:",
    "1) Re-check blocking tasks and overdue approvals in the project board.",
    "2) Confirm latest field evidence is attached to the current report cycle.",
    "3) Retry this chat shortly for full model-assisted guidance.",
    `Fallback reason: ${reason}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

interface StreamRequestBody {
  thread_id?: string | null;
  user_text: string;
  decision_context: DecisionContextPayload;
  locale?: string | null;
}

function sseEvent(name: string, data: unknown): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("X-Request-Id")?.trim() || generateRequestId();
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "Streaming unavailable", request_id: requestId },
      {
        status: 503,
        headers: {
          "X-Request-Id": requestId,
          "X-Stream-Status": "unavailable",
          "X-Fallback": "use non-stream endpoint",
        },
      }
    );
  }

  let body: StreamRequestBody;
  try {
    body = (await request.json()) as StreamRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userText = (body.user_text ?? "").trim();
  if (!userText) return NextResponse.json({ error: "user_text required" }, { status: 400 });

  const decisionContext = body.decision_context ?? {
    overall_risk: 0,
    confidence: 0,
    top_risk_factors: [],
    projected_delay_date: null,
    velocity_trend: "unknown",
    anomalies: [],
    aggregated_at: new Date().toISOString(),
  } as DecisionContextPayload;

  const tenantId = ctx.tenantId!;
  const userId = ctx.userId ?? "";

  let threadId = body.thread_id?.trim() || null;
  let recentMessages: { role: "user" | "assistant"; content: string }[] = [];

  try {
    if (threadId) {
      const { data: thread } = await supabase
        .from("ai_chat_threads")
        .select("id, project_id, tenant_id")
        .eq("id", threadId)
        .eq("project_id", projectId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }

      const { data: messages } = await supabase
        .from("ai_chat_messages")
        .select("role, content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(20);

      recentMessages = (messages ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content ?? "",
      }));
    } else {
      const { data: newThread, error: createErr } = await supabase
        .from("ai_chat_threads")
        .insert({
          tenant_id: tenantId,
          project_id: projectId,
          created_by: userId,
          title: null,
          status: "active",
        })
        .select("id")
        .single();

      if (createErr || !newThread?.id) {
        return NextResponse.json(
          { error: "Failed to create thread", request_id: requestId },
          { status: 503, headers: { "X-Request-Id": requestId } }
        );
      }
      threadId = newThread.id;
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Thread error", request_id: requestId },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }

  try {
    const { error: userMsgErr } = await supabase.from("ai_chat_messages").insert({
      tenant_id: tenantId,
      project_id: projectId,
      thread_id: threadId,
      role: "user",
      content: userText,
      request_id: requestId,
    });

    if (userMsgErr) {
      return NextResponse.json(
        { error: "Failed to persist user message", request_id: requestId },
        { status: 503, headers: { "X-Request-Id": requestId } }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to persist user message", request_id: requestId },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }

  // Historical context: summarize older messages when we have many (beyond last 5 used as recent)
  const RECENT_KEEP = 5;
  const olderMessages = recentMessages.length > RECENT_KEEP ? recentMessages.slice(0, -RECENT_KEEP) : [];
  const recentForContext = recentMessages.length > RECENT_KEEP ? recentMessages.slice(-RECENT_KEEP) : recentMessages;
  const historicalSummary =
    olderMessages.length > 0
      ? `Earlier conversation (${olderMessages.length} messages): ${olderMessages
          .map((m) => `${m.role}: ${m.content.slice(0, 80)}${m.content.length > 80 ? "…" : ""}`)
          .join(" | ")}`
      : "";

  const contextInput: ChatContextInput = {
    summary: historicalSummary,
    memoryChunks: [],
    recentMessages: recentForContext,
    currentUserMessage: userText,
  };
  const budgeted = applyContextBudget(contextInput, DEFAULT_CONTEXT_BUDGET);
  const ctxStr = formatDecisionContext(decisionContext);

  const systemPrompt = `You are a construction project assistant. Use the provided context to answer. Be concise and actionable. Do not invent numbers or facts not in the context.`;
  const contextBlock = budgeted.summary
    ? `Context: ${budgeted.summary}\n\nProject context: ${ctxStr}`
    : `Project context: ${ctxStr}`;

  const openaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: `${systemPrompt}\n\n${contextBlock}` },
    ...budgeted.recentMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userText },
  ];

  const config = getServerConfig();
  const apiKey = config.OPENAI_API_KEY;
  const model = "gpt-4o-mini";

  const streamStartMs = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      send("meta", {
        request_id: requestId,
        thread_id: threadId,
        context_tokens_estimated: budgeted.meta.context_tokens_estimated,
        context_trim_applied: budgeted.meta.context_trim_applied,
        memory_used: budgeted.meta.memory_used,
        memory_chunks_count: budgeted.meta.memory_chunks_count,
        summary_used: budgeted.meta.summary_used,
      });

      const abortCtrl = new AbortController();
      let streamTimedOut = false;
      const timeoutId = setTimeout(() => {
        streamTimedOut = true;
        abortCtrl.abort();
      }, 60_000);
      request.signal?.addEventListener("abort", () => abortCtrl.abort());

      const rel = getAiReleaseCorrelation();
      logCopilotStreamLifecycle("stream_started", {
        request_id: requestId,
        route: "POST /api/v1/projects/:id/copilot/chat/stream",
        tenant_id: tenantId,
        project_id: projectId,
        latency_ms: 0,
        ...rel,
      });

      let firstTokenMs: number | null = null;

      const persistAssistantMessage = async (
        content: string,
        errorKind: string | null = null
      ): Promise<string | null> => {
        try {
          const { data: inserted } = await supabase
            .from("ai_chat_messages")
            .insert({
              tenant_id: tenantId,
              project_id: projectId,
              thread_id: threadId,
              role: "assistant",
              content,
              request_id: requestId,
              error_kind: errorKind,
            })
            .select("id")
            .single();
          return inserted?.id ?? null;
        } catch {
          return null;
        }
      };

      const touchThread = async (): Promise<void> => {
        try {
          await supabase
            .from("ai_chat_threads")
            .update({
              updated_at: new Date().toISOString(),
              last_message_at: new Date().toISOString(),
            })
            .eq("id", threadId);
        } catch {
          // best-effort
        }
      };

      const completeWithFallback = async (
        fallbackReason:
          | "provider_unavailable"
          | "provider_timeout"
          | "stream_transport_failure"
          | "unknown_internal_error"
      ): Promise<void> => {
        const fallbackText = buildDeterministicFallbackText(userText, decisionContext, fallbackReason);
        const assistantMessageId = await persistAssistantMessage(fallbackText, "fallback_invoked");
        await touchThread();
        send("done", {
          request_id: requestId,
          thread_id: threadId,
          final_text: fallbackText,
          assistant_message_id: assistantMessageId,
          context_tokens_estimated: budgeted.meta.context_tokens_estimated,
          context_trim_applied: budgeted.meta.context_trim_applied,
          fallback_reason: fallbackReason,
        });
        const latencyMs = Date.now() - streamStartMs;
        logCopilotStreamLifecycle("stream_completed", {
          request_id: requestId,
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          tenant_id: tenantId,
          project_id: projectId,
          latency_ms: latencyMs,
          first_token_ms: firstTokenMs ?? undefined,
          ...rel,
        });
        logCopilotStreamComplete({
          request_id: requestId,
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          tenant_id: tenantId,
          project_id: projectId,
          user_id: userId || undefined,
          latency_ms: latencyMs,
          output_type: "copilot",
          streaming: true,
          context_tokens_estimated: budgeted.meta.context_tokens_estimated,
          context_trim_applied: budgeted.meta.context_trim_applied,
          memory_used: budgeted.meta.memory_used,
          memory_chunks_count: budgeted.meta.memory_chunks_count,
          summary_used: budgeted.meta.summary_used,
          provider: "none",
          first_token_ms: firstTokenMs,
          error_kind: "fallback_invoked",
          retryable:
            fallbackReason === "provider_timeout" || fallbackReason === "stream_transport_failure",
          ...rel,
        });
        void emitAiRuntimeAudit(supabase, {
          tenant_id: tenantId,
          user_id: userId || null,
          trace_id: requestId,
          project_id: projectId,
          action: "ai_copilot_stream_complete",
          details: {
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            latency_ms: latencyMs,
            output_type: "copilot",
            streaming: true,
            provider: "none",
            fallback_triggered: true,
            fallback_reason: fallbackReason,
            ...rel,
          },
        });
      };

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: openaiMessages,
            stream: true,
            max_tokens: 1024,
          }),
          signal: abortCtrl.signal,
        });

        if (!res.ok) {
          await res.text();
          const errorKind = res.status === 429 ? "rate_limit" : res.status === 504 ? "provider_timeout" : "provider_unavailable";
          const latencyMs = Date.now() - streamStartMs;
          logCopilotStreamLifecycle("stream_error", {
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            tenant_id: tenantId,
            project_id: projectId,
            latency_ms: latencyMs,
            error_kind: errorKind,
            retryable: res.status >= 500,
            ...rel,
          });
          logCopilotStreamError({
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            tenant_id: tenantId,
            project_id: projectId,
            latency_ms: latencyMs,
            error_kind: errorKind,
            retryable: res.status >= 500,
            ...rel,
          });
          void emitAiRuntimeAudit(supabase, {
            tenant_id: tenantId,
            user_id: userId || null,
            trace_id: requestId,
            project_id: projectId,
            action: "ai_copilot_stream_error",
            details: {
              request_id: requestId,
              route: "POST /api/v1/projects/:id/copilot/chat/stream",
              latency_ms: latencyMs,
              output_type: "copilot",
              error_kind: errorKind,
              retryable: res.status >= 500,
              ...rel,
            },
          });
          send("error", {
            request_id: requestId,
            retryable: res.status >= 500,
            message: "Provider error",
            kind: "provider_error",
          });
          await completeWithFallback(
            errorKind === "provider_timeout" ? "provider_timeout" : "provider_unavailable"
          );
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          const latencyMs = Date.now() - streamStartMs;
          logCopilotStreamLifecycle("stream_error", {
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            tenant_id: tenantId,
            project_id: projectId,
            latency_ms: latencyMs,
            error_kind: "stream_transport_failure",
            retryable: true,
            ...rel,
          });
          logCopilotStreamError({
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            tenant_id: tenantId,
            project_id: projectId,
            latency_ms: latencyMs,
            error_kind: "stream_transport_failure",
            retryable: true,
            ...rel,
          });
          void emitAiRuntimeAudit(supabase, {
            tenant_id: tenantId,
            user_id: userId || null,
            trace_id: requestId,
            project_id: projectId,
            action: "ai_copilot_stream_error",
            details: {
              request_id: requestId,
              route: "POST /api/v1/projects/:id/copilot/chat/stream",
              latency_ms: latencyMs,
              output_type: "copilot",
              error_kind: "stream_transport_failure",
              retryable: true,
              ...rel,
            },
          });
          send("error", {
            request_id: requestId,
            retryable: true,
            message: "No response body",
            kind: "provider_error",
          });
          await completeWithFallback("stream_transport_failure");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  if (firstTokenMs === null) {
                    firstTokenMs = Date.now() - streamStartMs;
                    logCopilotStreamLifecycle("first_token", {
                      request_id: requestId,
                      route: "POST /api/v1/projects/:id/copilot/chat/stream",
                      tenant_id: tenantId,
                      project_id: projectId,
                      latency_ms: firstTokenMs,
                      first_token_ms: firstTokenMs,
                      ...rel,
                    });
                  }
                  fullText += delta;
                  send("token", { delta });
                }
              } catch {
                // skip malformed chunk
              }
            }
          }
        }

        const assistantMessageId = await persistAssistantMessage(fullText);
        await touchThread();

        send("done", {
          request_id: requestId,
          thread_id: threadId,
          final_text: fullText,
          assistant_message_id: assistantMessageId,
          context_tokens_estimated: budgeted.meta.context_tokens_estimated,
          context_trim_applied: budgeted.meta.context_trim_applied,
          fallback_reason: null,
        });
        const latencyMs = Date.now() - streamStartMs;
        logCopilotStreamLifecycle("stream_completed", {
          request_id: requestId,
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          tenant_id: tenantId,
          project_id: projectId,
          latency_ms: latencyMs,
          first_token_ms: firstTokenMs ?? undefined,
          ...rel,
        });
        logCopilotStreamComplete({
          request_id: requestId,
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          tenant_id: tenantId,
          project_id: projectId,
          user_id: userId || undefined,
          latency_ms: latencyMs,
          output_type: "copilot",
          streaming: true,
          context_tokens_estimated: budgeted.meta.context_tokens_estimated,
          context_trim_applied: budgeted.meta.context_trim_applied,
          memory_used: budgeted.meta.memory_used,
          memory_chunks_count: budgeted.meta.memory_chunks_count,
          summary_used: budgeted.meta.summary_used,
          provider: "openai",
          first_token_ms: firstTokenMs,
          ...rel,
        });
        void emitAiRuntimeAudit(supabase, {
          tenant_id: tenantId,
          user_id: userId || null,
          trace_id: requestId,
          project_id: projectId,
          action: "ai_copilot_stream_complete",
          details: {
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            latency_ms: latencyMs,
            output_type: "copilot",
            streaming: true,
            provider: "openai",
            context_tokens_estimated: budgeted.meta.context_tokens_estimated,
            context_trim_applied: budgeted.meta.context_trim_applied,
            first_token_ms: firstTokenMs,
            ...rel,
          },
        });
      } catch (e) {
        const err = e as Error;
        const isAbort = err.name === "AbortError" || err.message?.includes("aborted");
        const clientGone = Boolean(request.signal?.aborted);
        const errorKind =
          isAbort && streamTimedOut && !clientGone
            ? "provider_timeout"
            : isAbort && clientGone
              ? "cancellation"
              : isAbort
                ? "cancellation"
                : "unknown_internal_error";
        const latencyMs = Date.now() - streamStartMs;
        const life = errorKind === "cancellation" ? "stream_cancelled" : "stream_error";
        logCopilotStreamLifecycle(life, {
          request_id: requestId,
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          tenant_id: tenantId,
          project_id: projectId,
          latency_ms: latencyMs,
          error_kind: errorKind,
          retryable: errorKind === "provider_timeout",
          ...rel,
        });
        logCopilotStreamError({
          request_id: requestId,
          route: "POST /api/v1/projects/:id/copilot/chat/stream",
          tenant_id: tenantId,
          project_id: projectId,
          latency_ms: latencyMs,
          error_kind: errorKind,
          retryable: errorKind === "provider_timeout",
          ...rel,
        });
        void emitAiRuntimeAudit(supabase, {
          tenant_id: tenantId,
          user_id: userId || null,
          trace_id: requestId,
          project_id: projectId,
          action: "ai_copilot_stream_error",
          details: {
            request_id: requestId,
            route: "POST /api/v1/projects/:id/copilot/chat/stream",
            latency_ms: latencyMs,
            output_type: "copilot",
            error_kind: errorKind,
            retryable: errorKind === "provider_timeout",
            ...rel,
          },
        });
        send("error", {
          request_id: requestId,
          retryable: errorKind === "provider_timeout",
          message: "Something went wrong",
          kind: errorKind === "provider_timeout" ? "timeout" : errorKind === "cancellation" ? "cancelled" : "unknown",
        });

        if (errorKind !== "cancellation") {
          await completeWithFallback(
            errorKind === "provider_timeout" ? "provider_timeout" : "unknown_internal_error"
          );
          return;
        }
      } finally {
        clearTimeout(timeoutId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Request-Id": requestId,
    },
  });
}
