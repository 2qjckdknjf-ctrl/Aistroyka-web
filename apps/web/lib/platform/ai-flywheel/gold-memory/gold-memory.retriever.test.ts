/**
 * Gold Memory retriever tests.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { retrieveGoldMemoryExamples } from "./gold-memory.retriever";
import type { GoldMemoryRow } from "./gold-memory.types";
import type { GoldMemoryEmbedder } from "./gold-memory.embedder";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function mockRow(overrides: Partial<GoldMemoryRow> = {}): GoldMemoryRow {
  return {
    id: "row-1",
    tenant_id: tenantA,
    task_type: "copilot_chat",
    audience: "manager",
    provenance: "expert_review",
    source_table: "ai_expert_reviews",
    source_id: "src-1",
    input_hash: "abc",
    scrubbed_input_json: { prompt: "test" },
    scrubbed_gold_output_json: { answer: "gold" },
    rationale: null,
    embedding_json: [1, 0, 0],
    embedding_model: "test",
    embedding_dim: 3,
    pii_scrub_version: "v1",
    finance_guard_passed: true,
    consent_snapshot: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const mockEmbedder: GoldMemoryEmbedder = {
  available: true,
  async embedText() {
    return { vector: [1, 0, 0], model: "test", dim: 3 };
  },
};

describe("retrieveGoldMemoryExamples", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_FLYWHEEL_ENABLED;
    delete process.env.AI_GOLD_MEMORY_ENABLED;
    delete process.env.AI_GOLD_MEMORY_READ_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns [] when read flag false", async () => {
    const supabase = { from: vi.fn() } as unknown as import("@supabase/supabase-js").SupabaseClient;
    const result = await retrieveGoldMemoryExamples(supabase, {
      tenantId: tenantA,
      taskType: "copilot_chat",
      audience: "manager",
      sanitizedText: "hello",
    });
    expect(result).toEqual([]);
  });

  it("tenant filter applied via repository query", async () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_READ_ENABLED = "true";

    const rows = [mockRow({ tenant_id: tenantA }), mockRow({ tenant_id: tenantB, id: "row-2" })];
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: rows.filter((r) => r.tenant_id === tenantA),
            error: null,
          }),
        }),
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await retrieveGoldMemoryExamples(supabase, {
      tenantId: tenantA,
      taskType: "copilot_chat",
      audience: "manager",
      sanitizedText: "schedule",
      embedder: mockEmbedder,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.audience === "manager")).toBe(true);
  });

  it("owner audience excludes rows without finance_guard_passed", async () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_READ_ENABLED = "true";

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [mockRow({ audience: "owner", finance_guard_passed: false })],
            error: null,
          }),
        }),
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await retrieveGoldMemoryExamples(supabase, {
      tenantId: tenantA,
      taskType: "copilot_chat",
      audience: "owner",
      sanitizedText: "estimate",
      embedder: mockEmbedder,
    });

    expect(result).toEqual([]);
  });

  it("retrieval failure returns []", async () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_READ_ENABLED = "true";

    const supabase = {
      from: vi.fn().mockImplementation(() => {
        throw new Error("db down");
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await retrieveGoldMemoryExamples(supabase, {
      tenantId: tenantA,
      taskType: "copilot_chat",
      audience: "manager",
      sanitizedText: "test",
      embedder: mockEmbedder,
    });

    expect(result).toEqual([]);
  });
});
