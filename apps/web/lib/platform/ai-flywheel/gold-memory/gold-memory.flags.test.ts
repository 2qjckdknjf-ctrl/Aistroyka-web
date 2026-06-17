/**
 * Gold Memory flags — all default OFF.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getGoldMemoryFlagSnapshot,
  isAiGoldMemoryWriteEnabled,
  isAiGoldMemoryReadEnabled,
  isAiGoldMemoryPromptInjectionEnabled,
  isGoldMemoryPromptInjectionActive,
} from "./gold-memory.flags";

describe("gold-memory flags", () => {
  const originalEnv = { ...process.env };
  const KEYS = [
    "AI_FLYWHEEL_ENABLED",
    "AI_GOLD_MEMORY_ENABLED",
    "AI_GOLD_MEMORY_WRITE_ENABLED",
    "AI_GOLD_MEMORY_READ_ENABLED",
    "AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED",
  ];

  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("all gold memory flags default false", () => {
    const snap = getGoldMemoryFlagSnapshot();
    expect(snap.AI_GOLD_MEMORY_ENABLED).toBe(false);
    expect(snap.AI_GOLD_MEMORY_WRITE_ENABLED).toBe(false);
    expect(snap.AI_GOLD_MEMORY_READ_ENABLED).toBe(false);
    expect(snap.AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED).toBe(false);
  });

  it("sub-flags require master gold memory gate", () => {
    process.env.AI_GOLD_MEMORY_WRITE_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_READ_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED = "true";
    expect(isAiGoldMemoryWriteEnabled()).toBe(false);
    expect(isAiGoldMemoryReadEnabled()).toBe(false);
    expect(isAiGoldMemoryPromptInjectionEnabled()).toBe(false);

    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_ENABLED = "true";
    expect(isAiGoldMemoryWriteEnabled()).toBe(true);
    expect(isAiGoldMemoryReadEnabled()).toBe(true);
    expect(isAiGoldMemoryPromptInjectionEnabled()).toBe(true);
  });

  it("prompt injection active only when read + injection enabled", () => {
    process.env.AI_FLYWHEEL_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_ENABLED = "true";
    process.env.AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED = "true";
    expect(isGoldMemoryPromptInjectionActive()).toBe(false);

    process.env.AI_GOLD_MEMORY_READ_ENABLED = "true";
    expect(isGoldMemoryPromptInjectionActive()).toBe(true);
  });
});
