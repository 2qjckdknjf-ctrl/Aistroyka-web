/**
 * Gold Memory guard pipeline tests.
 */

import { describe, expect, it, vi } from "vitest";
import * as verifier from "../pii-scrub-verifier";
import { guardGoldMemoryCandidate } from "./gold-memory.guard";
import type { GoldMemoryCandidate } from "./gold-memory.types";

function baseCandidate(overrides: Partial<GoldMemoryCandidate> = {}): GoldMemoryCandidate {
  return {
    tenantId: "t1",
    taskType: "copilot_chat",
    audience: "manager",
    provenance: "expert_review",
    sourceTable: "ai_expert_reviews",
    sourceId: "s1",
    inputJson: { prompt: "Schedule update" },
    goldOutputJson: { answer: "Review milestone delays." },
    consent: true,
    ...overrides,
  };
}

describe("guardGoldMemoryCandidate", () => {
  it("rejects when consent false", () => {
    const r = guardGoldMemoryCandidate(baseCandidate({ consent: false }));
    expect("reject" in r && r.reject.kind).toBe("consent");
  });

  it("rejects when post-scrub PII verifier fails", () => {
    vi.spyOn(verifier, "verifyScrubbedJson").mockReturnValueOnce({
      passed: false,
      violations: ["EMAIL"],
    });
    const r = guardGoldMemoryCandidate(
      baseCandidate({ inputJson: { email: "user@example.com" } })
    );
    expect("reject" in r && r.reject.kind).toBe("pii");
    vi.restoreAllMocks();
  });

  it("rejects owner audience with internal finance vocabulary", () => {
    const r = guardGoldMemoryCandidate(
      baseCandidate({
        audience: "owner",
        goldOutputJson: { answer: "Internal margin risk 12%" },
      })
    );
    expect("reject" in r && r.reject.kind).toBe("finance");
  });

  it("passes safe manager candidate", () => {
    const r = guardGoldMemoryCandidate(baseCandidate());
    expect("payload" in r).toBe(true);
    if ("payload" in r) {
      expect(r.payload.consentSnapshot).toBe(true);
      expect(r.payload.financeGuardPassed).toBe(true);
    }
  });
});
