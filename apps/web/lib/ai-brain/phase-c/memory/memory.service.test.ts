/**
 * AI Brain Phase C — Memory service tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateWritePolicy } from "./write-policy.evaluator";
import { isExpired, computeExpiresAt } from "./memory-boundaries";

vi.mock("../storage/memory.repository", () => ({
  createMemoryRecord: vi.fn(),
  getRelevantMemory: vi.fn(),
  markMemorySuperseded: vi.fn(),
  expireMemory: vi.fn(),
}));

describe("evaluateWritePolicy", () => {
  it("allows human_confirmed with high confidence", () => {
    const r = evaluateWritePolicy({
      memoryType: "project_working",
      sourceKind: "human_confirmed",
      hasGroundingRefs: false,
      tenantId: "t1",
    });
    expect(r.allowed).toBe(true);
    expect("confidence" in r && r.confidence).toBe("high");
  });

  it("rejects ai_inferred for project_working", () => {
    const r = evaluateWritePolicy({
      memoryType: "project_working",
      sourceKind: "ai_inferred",
      hasGroundingRefs: false,
      tenantId: "t1",
    });
    expect(r.allowed).toBe(false);
  });

  it("allows ai_inferred for session with low confidence", () => {
    const r = evaluateWritePolicy({
      memoryType: "session",
      sourceKind: "ai_inferred",
      hasGroundingRefs: false,
      tenantId: "t1",
    });
    expect(r.allowed).toBe(true);
    expect("confidence" in r && r.confidence).toBe("low");
  });

  it("rejects when tenant_id missing", () => {
    const r = evaluateWritePolicy({
      memoryType: "session",
      sourceKind: "system_derived",
      hasGroundingRefs: false,
      tenantId: "",
    });
    expect(r.allowed).toBe(false);
  });
});

describe("memory-boundaries", () => {
  it("isExpired returns true when expiresAt in past", () => {
    const past = new Date();
    past.setMinutes(past.getMinutes() - 10);
    expect(isExpired(past.toISOString())).toBe(true);
  });

  it("isExpired returns false when expiresAt in future", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(isExpired(future.toISOString())).toBe(false);
  });

  it("computeExpiresAt returns ISO for session", () => {
    const at = new Date("2026-03-23T12:00:00Z");
    const exp = computeExpiresAt("session", at);
    expect(exp).not.toBeNull();
    expect(new Date(exp!).getTime()).toBeGreaterThan(at.getTime());
  });
});
