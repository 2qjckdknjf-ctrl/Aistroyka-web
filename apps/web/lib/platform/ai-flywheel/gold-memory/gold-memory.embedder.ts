/**
 * Gold Memory embedder — optional OpenAI via existing HTTP retry pattern; no-op when disabled.
 */

import { createHash } from "node:crypto";
import { getServerConfig, isOpenAIConfigured } from "@/lib/config/server";
import { fetchWithOpenAiRetry } from "@/lib/platform/ai/openai-http-retry";
import { isAiGoldMemoryWriteEnabled } from "./gold-memory.flags";

export const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_DIM = 1536;

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dim: number;
}

export interface GoldMemoryEmbedder {
  readonly available: boolean;
  embedText(text: string): Promise<EmbeddingResult | null>;
}

export function computeInputHash(input: Record<string, unknown>): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

function truncateForEmbedding(text: string, maxChars = 8000): string {
  const t = text.trim();
  return t.length <= maxChars ? t : t.slice(0, maxChars);
}

/** Disabled no-op embedder — default when flags off or provider unavailable. */
export function createNoOpGoldMemoryEmbedder(): GoldMemoryEmbedder {
  return {
    available: false,
    async embedText(): Promise<EmbeddingResult | null> {
      return null;
    },
  };
}

/** OpenAI embedder — only when write flag + API key configured. Never logs raw text. */
export function createOpenAiGoldMemoryEmbedder(): GoldMemoryEmbedder {
  if (!isAiGoldMemoryWriteEnabled() || !isOpenAIConfigured()) {
    return createNoOpGoldMemoryEmbedder();
  }

  const config = getServerConfig();
  const apiKey = config.OPENAI_API_KEY?.trim();
  if (!apiKey) return createNoOpGoldMemoryEmbedder();

  const model =
    (typeof process !== "undefined" && process.env?.OPENAI_EMBEDDING_MODEL?.trim()) ||
    DEFAULT_EMBEDDING_MODEL;

  return {
    available: true,
    async embedText(text: string): Promise<EmbeddingResult | null> {
      try {
        const res = await fetchWithOpenAiRetry(
          OPENAI_EMBEDDINGS_URL,
          (signal) => ({
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              input: truncateForEmbedding(text),
            }),
            signal,
          }),
          { maxRetries: 1, timeoutMs: 30_000 }
        );

        if (!res.ok) return null;

        const json = (await res.json()) as {
          data?: Array<{ embedding?: number[] }>;
        };
        const vector = json.data?.[0]?.embedding;
        if (!Array.isArray(vector) || vector.length === 0) return null;

        return { vector, model, dim: vector.length };
      } catch {
        return null;
      }
    },
  };
}

/** Factory — returns no-op unless write flag + OpenAI configured. */
export function createGoldMemoryEmbedder(): GoldMemoryEmbedder {
  return createOpenAiGoldMemoryEmbedder();
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
