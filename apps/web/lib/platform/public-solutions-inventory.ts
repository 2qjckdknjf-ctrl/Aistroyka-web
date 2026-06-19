/**
 * Role inventory for LG-4.7 public /solutions page.
 * Each role describes experience fit — not a feature catalog.
 */

export const PUBLIC_SOLUTION_ROLES = [
  { key: "roleGeneralContractor", highlight: true },
  { key: "roleProjectManager", highlight: false },
  { key: "roleSiteManager", highlight: false },
  { key: "roleWorker", highlight: false },
  { key: "roleOwner", highlight: false },
  { key: "roleStakeholder", highlight: false },
] as const satisfies ReadonlyArray<{ key: string; highlight: boolean }>;

export type PublicSolutionRoleKey = (typeof PUBLIC_SOLUTION_ROLES)[number]["key"];
