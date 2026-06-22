/**
 * Gold Memory prompt section — sanitized few-shot injection for Copilot stream MVP.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isGoldMemoryPromptInjectionActive } from "./gold-memory.flags";
import { retrieveGoldMemoryExamples } from "./gold-memory.retriever";
import {
  buildGoldMemoryObservabilityMeta,
  emptyGoldMemoryObservabilityMeta,
  type GoldMemoryObservabilityInput,
} from "./gold-memory.observability";
import {
  COPILOT_GOLD_MEMORY_AUDIENCE,
  COPILOT_GOLD_MEMORY_TASK_TYPE,
  type GoldMemoryExample,
  type GoldMemoryRetrievalMeta,
} from "./gold-memory.types";

export const GOLD_MEMORY_PROMPT_MAX_CHARS = 2400;
export const GOLD_MEMORY_SECTION_HEADER =
  "Relevant sanitized examples from previous expert/manager corrections:";

function formatExampleBlock(ex: GoldMemoryExample, index: number): string {
  const inputStr = JSON.stringify(ex.scrubbedInput);
  const outputStr = JSON.stringify(ex.scrubbedGoldOutput);
  const rationale = ex.rationale?.trim()
    ? `\nRationale: ${ex.rationale.trim().slice(0, 200)}`
    : "";
  return [
    `Example ${index + 1} (${ex.provenance}, score ${ex.similarityScore.toFixed(2)}):`,
    `Input: ${inputStr}`,
    `Gold output: ${outputStr}${rationale}`,
  ].join("\n");
}

/** Build prompt section from examples with char cap. */
export function formatGoldMemoryPromptSection(
  examples: GoldMemoryExample[],
  maxChars = GOLD_MEMORY_PROMPT_MAX_CHARS
): { section: string; trimmed: boolean } {
  if (!examples.length) return { section: "", trimmed: false };

  const blocks: string[] = [];
  let total = GOLD_MEMORY_SECTION_HEADER.length + 1;
  let trimmed = false;

  for (let i = 0; i < examples.length; i++) {
    const block = formatExampleBlock(examples[i]!, i);
    if (total + block.length + 2 > maxChars) {
      trimmed = true;
      break;
    }
    blocks.push(block);
    total += block.length + 2;
  }

  if (!blocks.length) return { section: "", trimmed: true };

  return {
    section: `${GOLD_MEMORY_SECTION_HEADER}\n${blocks.join("\n\n")}`,
    trimmed,
  };
}

export interface EnrichCopilotContextInput {
  supabase: SupabaseClient;
  tenantId: string;
  sanitizedUserText: string;
  contextBlock: string;
  requestId?: string;
}

export interface EnrichCopilotContextResult {
  contextBlock: string;
  meta: GoldMemoryRetrievalMeta;
}

/** Append gold memory section to context block when all injection flags active. Fail-safe. */
export async function enrichCopilotStreamContextWithGoldMemory(
  input: EnrichCopilotContextInput
): Promise<EnrichCopilotContextResult> {
  const emptyMeta = emptyGoldMemoryObservabilityMeta(
    COPILOT_GOLD_MEMORY_TASK_TYPE,
    COPILOT_GOLD_MEMORY_AUDIENCE
  );

  if (!isGoldMemoryPromptInjectionActive()) {
    return { contextBlock: input.contextBlock, meta: emptyMeta };
  }

  const start = Date.now();
  try {
    const examples = await retrieveGoldMemoryExamples(input.supabase, {
      tenantId: input.tenantId,
      taskType: COPILOT_GOLD_MEMORY_TASK_TYPE,
      audience: COPILOT_GOLD_MEMORY_AUDIENCE,
      sanitizedText: input.sanitizedUserText,
      requestId: input.requestId,
    });

    const { section, trimmed } = formatGoldMemoryPromptSection(examples);
    const latencyMs = Date.now() - start;

    const obsInput: GoldMemoryObservabilityInput = {
      taskType: COPILOT_GOLD_MEMORY_TASK_TYPE,
      audience: COPILOT_GOLD_MEMORY_AUDIENCE,
      examplesCount: examples.length,
      trimmed,
      retrievalFailed: false,
      retrievalLatencyMs: latencyMs,
    };

    if (!section) {
      return {
        contextBlock: input.contextBlock,
        meta: buildGoldMemoryObservabilityMeta(obsInput),
      };
    }

    const enriched = [input.contextBlock, section].filter(Boolean).join("\n\n");
    return {
      contextBlock: enriched,
      meta: buildGoldMemoryObservabilityMeta(obsInput),
    };
  } catch {
    return {
      contextBlock: input.contextBlock,
      meta: {
        ...emptyMeta,
        retrieval_failed: true,
        retrieval_latency_ms: Date.now() - start,
      },
    };
  }
}

/** Test helper — build section without DB when examples provided directly. */
export function appendGoldMemorySectionToPrompt(
  basePrompt: string,
  examples: GoldMemoryExample[]
): string {
  const { section } = formatGoldMemoryPromptSection(examples);
  if (!section) return basePrompt;
  return `${basePrompt}\n\n${section}`;
}
