/**
 * Gold Memory prompt injection tests.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  appendGoldMemorySectionToPrompt,
  formatGoldMemoryPromptSection,
  GOLD_MEMORY_PROMPT_MAX_CHARS,
  GOLD_MEMORY_SECTION_HEADER,
} from "./gold-memory.prompt";
import type { GoldMemoryExample } from "./gold-memory.types";

const example: GoldMemoryExample = {
  scrubbedInput: { prompt: "Schedule risk?" },
  scrubbedGoldOutput: { answer: "Review milestone M3." },
  provenance: "expert_review",
  rationale: "Expert fix",
  similarityScore: 0.91,
  taskType: "copilot_chat",
  audience: "manager",
};

describe("gold-memory prompt", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const k of [
      "AI_FLYWHEEL_ENABLED",
      "AI_GOLD_MEMORY_ENABLED",
      "AI_GOLD_MEMORY_READ_ENABLED",
      "AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED",
    ]) {
      delete process.env[k];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("formatGoldMemoryPromptSection includes header and sanitized content", () => {
    const { section } = formatGoldMemoryPromptSection([example]);
    expect(section).toContain(GOLD_MEMORY_SECTION_HEADER);
    expect(section).toContain("expert_review");
    expect(section).toContain("Schedule risk");
    expect(section).not.toContain("user@");
  });

  it("prompt length cap trims examples", () => {
    const big: GoldMemoryExample = {
      ...example,
      scrubbedGoldOutput: { answer: "x".repeat(GOLD_MEMORY_PROMPT_MAX_CHARS) },
    };
    const { section, trimmed } = formatGoldMemoryPromptSection([big, big, big], 500);
    expect(trimmed).toBe(true);
    expect(section.length).toBeLessThanOrEqual(500);
  });

  it("appendGoldMemorySectionToPrompt leaves base unchanged when no examples", () => {
    const base = "System prompt here";
    expect(appendGoldMemorySectionToPrompt(base, [])).toBe(base);
  });

  it("flags false path: enrich returns unchanged context (via import check)", async () => {
    const { enrichCopilotStreamContextWithGoldMemory } = await import("./gold-memory.prompt");
    const supabase = {} as import("@supabase/supabase-js").SupabaseClient;
    const base = "Context block";
    const result = await enrichCopilotStreamContextWithGoldMemory({
      supabase,
      tenantId: "t1",
      sanitizedUserText: "hello",
      contextBlock: base,
    });
    expect(result.contextBlock).toBe(base);
    expect(result.meta.gold_memory_used).toBe(false);
  });
});
