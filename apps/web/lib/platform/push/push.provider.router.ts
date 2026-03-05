/**
 * Resolve push provider by platform. Used by outbox drain job.
 */

import type { PushProvider, PushSendParams, PushSendResult } from "./push.provider.types";
import { getApnsProvider } from "./apns.provider";
import { getFcmProvider } from "./fcm.provider";

export function getProviderForPlatform(platform: string): PushProvider | null {
  const p = platform?.toLowerCase();
  if (p === "ios") return getApnsProvider();
  if (p === "android") return getFcmProvider();
  return null;
}

/**
 * Attempt send via platform provider. Returns result for outbox status update.
 */
export async function attemptSend(params: PushSendParams): Promise<PushSendResult> {
  const provider = getProviderForPlatform(params.platform);
  if (!provider) return { ok: false, code: "retryable", message: "No provider for platform" };
  return provider.send(params);
}
