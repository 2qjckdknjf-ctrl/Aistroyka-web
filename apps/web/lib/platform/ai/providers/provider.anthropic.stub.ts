/**
 * Anthropic provider stub. Full implementation in future.
 */

import type { VisionResult } from "./provider.interface";

export async function invokeVision(_imageUrl: string): Promise<VisionResult | null> {
  return null;
}

export const anthropicProvider = { name: "anthropic", invokeVision };
