import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  logCopilotStreamComplete,
  logCopilotStreamError,
  logCopilotNonStreamComplete,
  logIntelligenceComplete,
  logIntelligenceError,
} from "./ai-telemetry";

vi.mock("./logger", () => ({
  logStructured: vi.fn(),
}));

const { logStructured } = await import("./logger");

describe("ai-telemetry", () => {
  beforeEach(() => {
    vi.mocked(logStructured).mockClear();
  });

  it("logCopilotStreamComplete emits ai_copilot_stream_complete with safe metadata", () => {
    logCopilotStreamComplete({
      request_id: "req-1",
      route: "POST /api/v1/projects/:id/copilot/chat/stream",
      tenant_id: "t1",
      project_id: "p1",
      latency_ms: 1200,
      output_type: "copilot",
      streaming: true,
      context_tokens_estimated: 500,
      context_trim_applied: true,
    });
    expect(logStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ai_copilot_stream_complete",
        request_id: "req-1",
        route: "POST /api/v1/projects/:id/copilot/chat/stream",
        tenant_id: "t1",
        project_id: "p1",
        latency_ms: 1200,
        output_type: "copilot",
        streaming: true,
        context_tokens_estimated: 500,
        context_trim_applied: true,
      })
    );
    expect(logStructured).not.toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.anything(),
        user_text: expect.anything(),
      })
    );
  });

  it("logCopilotStreamError emits ai_copilot_stream_error with error_kind", () => {
    logCopilotStreamError({
      request_id: "req-2",
      route: "POST /api/v1/projects/:id/copilot/chat/stream",
      latency_ms: 500,
      error_kind: "provider_timeout",
      retryable: true,
    });
    expect(logStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ai_copilot_stream_error",
        request_id: "req-2",
        error_kind: "provider_timeout",
        retryable: true,
      })
    );
  });

  it("logIntelligenceComplete emits ai_intelligence_complete with diagnostics", () => {
    logIntelligenceComplete({
      request_id: "req-3",
      route: "GET /api/v1/projects/:id/intelligence",
      tenant_id: "t1",
      project_id: "p1",
      latency_ms: 800,
      output_type: "intelligence",
      data_sufficiency: "partial",
      health_score: 65,
      insights_count: 5,
      missing_data_disclaimer: true,
    });
    expect(logStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ai_intelligence_complete",
        request_id: "req-3",
        data_sufficiency: "partial",
        health_score: 65,
        insights_count: 5,
        missing_data_disclaimer: true,
      })
    );
  });

  it("logCopilotNonStreamComplete emits ai_copilot_non_stream_complete with fallback fields", () => {
    logCopilotNonStreamComplete({
      request_id: "req-ns",
      route: "GET /api/v1/projects/:id/copilot",
      tenant_id: "t1",
      project_id: "p1",
      latency_ms: 300,
      output_type: "copilot",
      streaming: false,
      fallback_triggered: true,
      fallback_reason: "provider_unavailable_or_error",
      fallback_target_path: "deterministicFallback",
      use_case: "generateManagerBrief",
      provider: "none",
    });
    expect(logStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ai_copilot_non_stream_complete",
        request_id: "req-ns",
        fallback_triggered: true,
        fallback_reason: "provider_unavailable_or_error",
        fallback_target_path: "deterministicFallback",
        provider: "none",
      })
    );
  });

  it("logIntelligenceError emits ai_intelligence_error", () => {
    logIntelligenceError({
      request_id: "req-4",
      route: "GET /api/v1/projects/:id/intelligence",
      latency_ms: 100,
      error_kind: "tenant_failure",
    });
    expect(logStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "ai_intelligence_error",
        request_id: "req-4",
        error_kind: "tenant_failure",
      })
    );
  });
});
