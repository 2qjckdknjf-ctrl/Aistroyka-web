/**
 * Contractor-internal gate for material supply draft/compare routes.
 * Portal / stakeholder / customer roles are forbidden buyers (D10).
 */

const ALLOWED_ROLES = new Set(["owner", "admin"]);

export function canSeedOrCompareMaterialSupply(role: string | null | undefined): boolean {
  if (!role) return false;
  return ALLOWED_ROLES.has(role);
}
