type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

/** English/backend `error` strings → `apiErrors` message keys */
const API_ERROR_KEY: Record<string, string> = {
  "Insufficient rights": "insufficientRights",
  "Project not found": "projectNotFound",
  "Tenant required": "tenantRequired",
  "Client portal is not enabled": "clientPortalNotEnabled",
  "Not available": "notAvailable",
  "Missing project id": "missingProjectId",
  "Update failed": "updateFailed",
  "Manager access required": "managerAccessRequired",
  "Unable to build digest": "unableToBuildDigest",
  "Failed to load": "genericLoadFailed",
  "Failed to load digest": "genericLoadFailed",
  "Failed": "genericLoadFailed",
  "Transition failed": "genericLoadFailed",
  "Could not submit": "genericLoadFailed",
};

/**
 * Map known API error strings to `apiErrors` translations; pass through unknown text (e.g. validation detail).
 */
export function translateApiError(raw: string | undefined, t: Translate): string {
  if (raw == null || raw.trim() === "") return t("genericLoadFailed");
  const key = API_ERROR_KEY[raw];
  if (key) return t(key);
  return raw;
}
