export type LaunchStepKey = "createProject" | "inviteTeam" | "addTask" | "uploadReport" | "viewAi";
export type LaunchRole = "manager" | "admin" | "client" | "owner";

export type ActivationStatusResponse = {
  getStarted?: Partial<Record<LaunchStepKey, boolean>>;
};

export const LAUNCH_STEPS: Array<{ key: LaunchStepKey; href: string }> = [
  { key: "createProject", href: "/dashboard/projects" },
  { key: "inviteTeam", href: "/team" },
  { key: "addTask", href: "/dashboard/tasks" },
  { key: "uploadReport", href: "/dashboard/daily-reports" },
  { key: "viewAi", href: "/dashboard/ai" },
];

export function getCompletedCount(status: ActivationStatusResponse | undefined): number {
  if (!status?.getStarted) return 0;
  return LAUNCH_STEPS.reduce((sum, step) => (status.getStarted?.[step.key] ? sum + 1 : sum), 0);
}

export function getNextLaunchStep(status: ActivationStatusResponse | undefined) {
  for (const step of LAUNCH_STEPS) {
    if (!status?.getStarted?.[step.key]) return step;
  }
  return null;
}

export function detectLaunchRole(pathname: string): LaunchRole {
  if (pathname.includes("/admin")) return "admin";
  if (pathname.includes("/client")) return "client";
  if (pathname.includes("/owner")) return "owner";
  return "manager";
}

const ROLE_PRIORITIES: Record<LaunchRole, LaunchStepKey[]> = {
  manager: ["createProject", "addTask", "uploadReport", "inviteTeam", "viewAi"],
  admin: ["inviteTeam", "createProject", "addTask", "viewAi", "uploadReport"],
  client: ["viewAi", "uploadReport", "inviteTeam", "createProject", "addTask"],
  owner: ["viewAi", "createProject", "inviteTeam", "uploadReport", "addTask"],
};

export function getRoleFirstActions(role: LaunchRole, status: ActivationStatusResponse | undefined): LaunchStepKey[] {
  const order = ROLE_PRIORITIES[role];
  const pending = order.filter((key) => !status?.getStarted?.[key]);
  return pending.slice(0, 3);
}

