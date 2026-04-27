import path from "node:path";
import fs from "node:fs";

export const e2eLocale = process.env.E2E_LOCALE || "en";

export function dashboardUrl(suffix: string) {
  const clean = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `/${e2eLocale}${clean}`;
}

export type RouteMap = {
  dashboard: string;
  projects: string;
  projectDetail: (id: string) => string;
  uploads: string;
  devices: string;
  ai: string;
  tasks: string;
};

export function buildRouteMap(projectId: string): RouteMap {
  return {
    dashboard: dashboardUrl("/dashboard"),
    projects: dashboardUrl("/dashboard/projects"),
    projectDetail: (id: string) => dashboardUrl(`/dashboard/projects/${id}`),
    uploads: dashboardUrl("/dashboard/uploads"),
    devices: dashboardUrl("/dashboard/devices"),
    ai: dashboardUrl("/dashboard/ai"),
    tasks: dashboardUrl("/dashboard/tasks"),
  };
}

type ProjectsResponse = { data?: Array<{ id: string }> };

export async function resolveProjectId(
  request: { get: (url: string, opts?: object) => Promise<{ ok: () => boolean; status: () => number; json: () => Promise<unknown> }> },
  explicit?: string
): Promise<string> {
  if (explicit) return explicit;
  const envId = process.env.E2E_PROJECT_ID;
  if (envId) return envId;
  const res = await request.get("/api/v1/projects", { failOnStatusCode: false });
  if (!res.ok()) {
    throw new Error(`Could not list projects for E2E_PROJECT_ID discovery: HTTP ${res.status()}`);
  }
  const body = (await res.json()) as ProjectsResponse;
  const first = Array.isArray(body.data) ? body.data[0]?.id : undefined;
  if (!first) {
    throw new Error("No projects returned from GET /api/v1/projects; set E2E_PROJECT_ID.");
  }
  return first;
}

export function inventoryPath() {
  return path.join(process.cwd(), "../../docs/audit/button_inventory.json");
}

export function loadJsonInventory<T>(): T[] {
  const p = inventoryPath();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")) as T[];
}
