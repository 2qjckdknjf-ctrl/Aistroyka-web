/**
 * FCM stub. Implement when FCM server key or service account is configured.
 */

export function isFcmConfigured(): boolean {
  return Boolean(process.env.FCM_SERVER_KEY?.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
}

/** Send push to Android device. Stub: returns false when not configured. */
export async function sendFcm(_deviceToken: string, _payload: Record<string, unknown>): Promise<boolean> {
  if (!isFcmConfigured()) return false;
  return false;
}
