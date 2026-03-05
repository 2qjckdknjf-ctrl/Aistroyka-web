/**
 * APNs stub. Implement when APNs credentials (key + keyId + teamId + bundleId) are configured.
 */

export function isApnsConfigured(): boolean {
  return Boolean(
    process.env.APNS_KEY?.trim() &&
    process.env.APNS_KEY_ID?.trim() &&
    process.env.APNS_TEAM_ID?.trim() &&
    process.env.APNS_BUNDLE_ID?.trim()
  );
}

/** Send push to iOS device. Stub: returns false when not configured. */
export async function sendApns(_deviceToken: string, _payload: Record<string, unknown>): Promise<boolean> {
  if (!isApnsConfigured()) return false;
  return false;
}
