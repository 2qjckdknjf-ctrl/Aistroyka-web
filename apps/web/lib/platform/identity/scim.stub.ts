/**
 * SCIM stub. Endpoint skeleton returns 501 unless enabled + configured.
 */

export function isScimEnabled(): boolean {
  return Boolean(process.env.SCIM_ENABLED === "true");
}

export function getScimToken(): string | null {
  return process.env.SCIM_TOKEN?.trim() ?? null;
}
