import { describe, expect, it, vi } from "vitest";
import {
  normalizeCreatedAtBound,
  presentAIRequestRow,
  userMessageKeyForJobStatus,
} from "./ai-request-presentation";

vi.mock("@/lib/config/server", () => ({
  isAnyVisionProviderConfigured: () => true,
}));

describe("ai-request-presentation", () => {
  it("expands date-only bounds to full UTC day", () => {
    expect(normalizeCreatedAtBound("2026-08-02", "from")).toBe("2026-08-02T00:00:00.000Z");
    expect(normalizeCreatedAtBound("2026-08-02", "to")).toBe("2026-08-02T23:59:59.999Z");
  });

  it("maps dead provider-exhausted jobs to temporary user message", () => {
    expect(userMessageKeyForJobStatus("dead", "AI_PROVIDERS_EXHAUSTED")).toBe("aiStatusTemporary");
    expect(userMessageKeyForJobStatus("queued", null)).toBe("aiStatusQueued");
    expect(userMessageKeyForJobStatus("success", null)).toBe("aiStatusSuccess");
  });

  it("presents dead jobs with sanitized error (not empty-state)", () => {
    const row = presentAIRequestRow({
      id: "job-1",
      type: "ai_analyze_media",
      status: "dead",
      payload: { report_id: "r1" },
      attempts: 5,
      last_error: "All AI providers failed sk-abcdefghijklmnopqrstuv",
      last_error_type: "AI_PROVIDERS_EXHAUSTED",
      created_at: "2026-08-02T12:00:00Z",
      updated_at: "2026-08-02T12:05:00Z",
    });
    expect(row.status).toBe("dead");
    expect(row.user_message_key).toBe("aiStatusTemporary");
    expect(row.last_error).not.toContain("sk-");
    expect(row.entity).toBe("r1");
    expect(row.report_id).toBe("r1");
    expect(row.media_id).toBeNull();
  });

  it("exposes report_id and media_id without inventing a new route", () => {
    const row = presentAIRequestRow({
      id: "job-2",
      type: "ai_analyze_media",
      status: "success",
      payload: { report_id: "rep-9", media_id: "med-3" },
      attempts: 1,
      created_at: "2026-08-02T12:00:00Z",
      updated_at: "2026-08-02T12:01:00Z",
    });
    expect(row.report_id).toBe("rep-9");
    expect(row.media_id).toBe("med-3");
    expect(row.entity).toBe("rep-9");
  });
});
