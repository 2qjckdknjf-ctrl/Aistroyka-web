/**
 * Gold Memory observability — safe metadata only, no raw content.
 */

import type { GoldMemoryRetrievalMeta } from "./gold-memory.types";

export interface GoldMemoryObservabilityInput {
  taskType: string;
  audience: string;
  examplesCount: number;
  trimmed: boolean;
  retrievalFailed: boolean;
  retrievalLatencyMs: number;
  errorKind?: string;
}

export function emptyGoldMemoryObservabilityMeta(
  taskType: string,
  audience: string
): GoldMemoryRetrievalMeta {
  return {
    gold_memory_used: false,
    gold_memory_count: 0,
    gold_memory_task_type: taskType,
    gold_memory_audience: audience,
    gold_memory_trimmed: false,
    retrieval_failed: false,
    retrieval_latency_ms: 0,
  };
}

export function buildGoldMemoryObservabilityMeta(
  input: GoldMemoryObservabilityInput
): GoldMemoryRetrievalMeta {
  return {
    gold_memory_used: input.examplesCount > 0,
    gold_memory_count: input.examplesCount,
    gold_memory_task_type: input.taskType,
    gold_memory_audience: input.audience,
    gold_memory_trimmed: input.trimmed,
    retrieval_failed: input.retrievalFailed,
    retrieval_latency_ms: input.retrievalLatencyMs,
  };
}

export function goldMemoryMetaForStreamMeta(
  meta: GoldMemoryRetrievalMeta
): Record<string, unknown> {
  return {
    gold_memory_used: meta.gold_memory_used,
    gold_memory_count: meta.gold_memory_count,
    gold_memory_task_type: meta.gold_memory_task_type,
    gold_memory_audience: meta.gold_memory_audience,
    gold_memory_trimmed: meta.gold_memory_trimmed,
    retrieval_failed: meta.retrieval_failed,
    retrieval_latency_ms: meta.retrieval_latency_ms,
  };
}

export function getBuildSha7(): string | null {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim();
  return sha ? sha.slice(0, 7) : null;
}
