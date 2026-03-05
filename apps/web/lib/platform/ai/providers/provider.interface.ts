/**
 * AI provider interface for vision. Stable for multi-provider routing.
 */

export interface VisionResult {
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  providerUsed: string;
  modelUsed: string;
}

export interface VisionOptions {
  model?: string;
  maxTokens?: number;
}

export type AIProvider = {
  name: string;
  invokeVision(imageUrl: string, options?: VisionOptions): Promise<VisionResult | null>;
};
