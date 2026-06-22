/**
 * Code-backed public API readiness inventory for LG-4.5 marketing page.
 * Status values must match route evidence documented in docs/design/LG45_API_* audits.
 */

export type PublicApiReadiness = "live" | "partial" | "planned";

export const PUBLIC_API_CATEGORIES = [
  { key: "catProjects", readiness: "live" },
  { key: "catReporting", readiness: "live" },
  { key: "catMedia", readiness: "live" },
  { key: "catStakeholder", readiness: "partial" },
  { key: "catIntegration", readiness: "partial" },
  { key: "catAdministration", readiness: "partial" },
] as const satisfies ReadonlyArray<{ key: string; readiness: PublicApiReadiness }>;

export const PUBLIC_API_AUTH_KEYS = [
  "authSession",
  "authTenant",
  "authPermissions",
  "authProgram",
] as const;

export const PUBLIC_API_JOURNEY_KEYS = [
  "stepDiscover",
  "stepAuthenticate",
  "stepIntegrate",
  "stepValidate",
  "stepOperate",
] as const;

export const PUBLIC_API_MATRIX_KEYS = ["matrixLive", "matrixPartial", "matrixPlanned"] as const;

/** Illustrative routes only — not an OpenAPI catalog. */
export const PUBLIC_API_EXAMPLE_ROUTES = [
  "GET /api/v1/projects",
  "GET /api/v1/reports?project_id=...",
  "POST /api/v1/media/upload-sessions",
  "GET /api/v1/sync/bootstrap",
  "GET /api/v1/share/proof/{token}",
] as const;

export function publicApiStatusKey(
  readiness: PublicApiReadiness,
): "statusLive" | "statusPartial" | "statusPlanned" {
  switch (readiness) {
    case "live":
      return "statusLive";
    case "partial":
      return "statusPartial";
    case "planned":
      return "statusPlanned";
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}
