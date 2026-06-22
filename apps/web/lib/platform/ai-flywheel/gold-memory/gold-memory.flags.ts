/**
 * Gold Memory feature flags — all default OFF.
 * Requires AI_FLYWHEEL_ENABLED + AI_GOLD_MEMORY_ENABLED master gates.
 */

import { isAiGoldMemoryEnabled } from "../flags";

function getEnv(name: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function isTruthyEnv(name: string): boolean {
  const v = getEnv(name).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function masterGoldMemoryEnabled(): boolean {
  return isAiGoldMemoryEnabled();
}

export function isAiGoldMemoryWriteEnabled(): boolean {
  return masterGoldMemoryEnabled() && isTruthyEnv("AI_GOLD_MEMORY_WRITE_ENABLED");
}

export function isAiGoldMemoryReadEnabled(): boolean {
  return masterGoldMemoryEnabled() && isTruthyEnv("AI_GOLD_MEMORY_READ_ENABLED");
}

export function isAiGoldMemoryPromptInjectionEnabled(): boolean {
  return (
    masterGoldMemoryEnabled() &&
    isTruthyEnv("AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED")
  );
}

export function isGoldMemoryPromptInjectionActive(): boolean {
  return (
    isAiGoldMemoryReadEnabled() && isAiGoldMemoryPromptInjectionEnabled()
  );
}

export interface GoldMemoryFlagSnapshot {
  AI_GOLD_MEMORY_ENABLED: boolean;
  AI_GOLD_MEMORY_WRITE_ENABLED: boolean;
  AI_GOLD_MEMORY_READ_ENABLED: boolean;
  AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED: boolean;
}

export function getGoldMemoryFlagSnapshot(): GoldMemoryFlagSnapshot {
  return {
    AI_GOLD_MEMORY_ENABLED: masterGoldMemoryEnabled(),
    AI_GOLD_MEMORY_WRITE_ENABLED: isAiGoldMemoryWriteEnabled(),
    AI_GOLD_MEMORY_READ_ENABLED: isAiGoldMemoryReadEnabled(),
    AI_GOLD_MEMORY_PROMPT_INJECTION_ENABLED: isAiGoldMemoryPromptInjectionEnabled(),
  };
}
