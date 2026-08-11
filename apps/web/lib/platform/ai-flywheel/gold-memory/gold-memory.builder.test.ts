/**
 * Gold Memory builder tests.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import * as verifier from "../pii-scrub-verifier";
import { buildGoldMemoryFromCandidates } from "./gold-memory.builder";
import type { GoldMemoryCandidate } from "./gold-memory.types";
import type { GoldMemoryEmbedder } from "./gold-memory.embedder";

const mockEmbedder: GoldMemoryEmbedder = {
  available: true,
  async embedText() {
    return { vector: [1, 0, 0], model: "test", dim: 3 };
  },
};

describe("buildGoldMemoryFromCandidates", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_GOLD_MEMORY_ENABLED;
    delete process.env.AI_GOLD_MEMORY_WRITE_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const safeCandidate: GoldMemoryCandidate = {
    tenantId: "t-consent",
    taskType: "copilot_chat",
    audience: "manager",
    provenance: "expert_review",
    sourceTable: "ai_expert_reviews",
    sourceId: "00000000-0000-4000-8000-000000000010",
    inputJson: { prompt: "Daily summary" },
    goldOutputJson: { answer: "Check open defects." },
    consent: true,
  };

  it("dry-run writes nothing", async () => {
    const result = await buildGoldMemoryFromCandidates(null, [safeCandidate], {
      dryRun: true,
      embedder: mockEmbedder,
    });
    expect(result.stats.eligible).toBe(1);
    expect(result.stats.written).toBe(0);
  });

  it("write flag false writes nothing even with dryRun false", async () => {
    const result = await buildGoldMemoryFromCandidates(null, [safeCandidate], {
      dryRun: false,
      embedder: mockEmbedder,
    });
    expect(result.stats.eligible).toBe(1);
    expect(result.stats.written).toBe(0);
  });

  it("consent false skips candidate", async () => {
    const result = await buildGoldMemoryFromCandidates(
      null,
      [{ ...safeCandidate, consent: false }],
      { dryRun: true }
    );
    expect(result.stats.consentRejected).toBe(1);
    expect(result.stats.eligible).toBe(0);
  });

  it("PII verifier failure skips candidate", async () => {
    vi.spyOn(verifier, "verifyScrubbedJson").mockReturnValueOnce({
      passed: false,
      violations: ["EMAIL"],
    });
    const result = await buildGoldMemoryFromCandidates(
      null,
      [safeCandidate],
      { dryRun: true }
    );
    expect(result.stats.piiRejected).toBe(1);
    vi.restoreAllMocks();
  });

  it("finance guard failure skips owner candidate", async () => {
    const result = await buildGoldMemoryFromCandidates(
      null,
      [
        {
          ...safeCandidate,
          audience: "owner",
          goldOutputJson: { text: "subcontractor cost €5000 internal" },
        },
      ],
      { dryRun: true }
    );
    expect(result.stats.financeRejected).toBe(1);
  });

  it("duplicate source skipped in same batch", async () => {
    const dup = { ...safeCandidate };
    const result = await buildGoldMemoryFromCandidates(null, [dup, dup], {
      dryRun: true,
    });
    expect(result.stats.duplicateSkipped).toBe(1);
    expect(result.stats.eligible).toBe(1);
  });
});
