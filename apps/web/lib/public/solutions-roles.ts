export const SOLUTION_ROLES = ["business", "manager", "field"] as const;
export type SolutionRole = (typeof SOLUTION_ROLES)[number];

export function parseSolutionRole(value: string | null | undefined): SolutionRole {
  if (value === "manager" || value === "field" || value === "business") return value;
  return "business";
}

export function solutionsRoleHref(pathname: string, role: SolutionRole): string {
  const [path] = pathname.split("?");
  return `${path}?role=${role}`;
}

export function nextSolutionRoleOnKey(current: SolutionRole, key: string): SolutionRole | null {
  const index = SOLUTION_ROLES.indexOf(current);
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return SOLUTION_ROLES[(index + 1) % SOLUTION_ROLES.length];
    case "ArrowLeft":
    case "ArrowUp":
      return SOLUTION_ROLES[(index - 1 + SOLUTION_ROLES.length) % SOLUTION_ROLES.length];
    case "Home":
      return SOLUTION_ROLES[0];
    case "End":
      return SOLUTION_ROLES[SOLUTION_ROLES.length - 1];
    default:
      return null;
  }
}
