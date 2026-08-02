import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  loginViaUi,
  personaCredentials,
  readJson,
  requireDeviceId,
  requireE2eProjectId,
} from "./helpers";

async function workerAuthRequest(page: import("@playwright/test").Page): Promise<APIRequestContext> {
  // Cookie jar from UI login is attached to page.request
  return page.request;
}

async function assertLiteDeny(
  request: APIRequestContext,
  path: string,
  client: "ios_worker" | "android_worker",
  deviceId?: string
) {
  const res = await request.get(path, {
    headers: {
      "x-client": client,
      ...(deviceId ? { "x-device-id": deviceId } : {}),
    },
  });
  expect(res.status(), `${client} ${path}`).toBe(403);
  const body = (await readJson(res)) as { code?: string; error?: string };
  expect(body.code || body.error, `${client} ${path} code`).toMatch(/lite_client_path_forbidden/);
}

test.describe("Phase 3E worker ios_worker / android_worker allow-list", () => {
  test("allowed worker surfaces + segment-safe denials", async ({ page }) => {
    const { email, password } = personaCredentials("worker");
    const projectId = requireE2eProjectId();
    const deviceId = requireDeviceId();

    await loginViaUi(page, email, password, /\/(en|ru|es|it)\/dashboard/);
    const request = await workerAuthRequest(page);

    for (const client of ["ios_worker", "android_worker"] as const) {
      const projects = await request.get("/api/v1/projects", {
        headers: { "x-client": client },
      });
      expect(projects.status(), `${client} projects`).toBe(200);
      const projectsBody = (await projects.json()) as { data?: Array<{ id?: string }> };
      expect((projectsBody.data || []).map((p) => p.id)).toContain(projectId);

      const boot = await request.get("/api/v1/sync/bootstrap", {
        headers: { "x-client": client, "x-device-id": deviceId },
      });
      expect(boot.status(), `${client} bootstrap`).toBe(200);
      const bootBody = (await boot.json()) as {
        cursor?: number;
        data?: { tasks?: unknown; reports?: unknown; uploadSessions?: unknown };
      };
      expect(typeof bootBody.cursor).toBe("number");
      expect(bootBody.data?.tasks).toBeDefined();
      expect(bootBody.data?.reports).toBeDefined();
      expect(bootBody.data?.uploadSessions).toBeDefined();

      const today = await request.get(`/api/v1/worker/tasks/today?project_id=${projectId}`, {
        headers: { "x-client": client, "x-device-id": deviceId },
      });
      expect(today.status(), `${client} tasks/today`).toBe(200);
      const todayBody = await today.json();
      // Honest empty state — array or empty data object, no invented tasks
      const tasks =
        (todayBody as { data?: unknown }).data ??
        (todayBody as { tasks?: unknown }).tasks ??
        todayBody;
      if (Array.isArray(tasks)) {
        expect(tasks.length).toBe(0);
      } else if (tasks && typeof tasks === "object" && Array.isArray((tasks as { items?: unknown[] }).items)) {
        expect((tasks as { items: unknown[] }).items.length).toBe(0);
      } else {
        // Accept empty object / nullish empty payload
        expect(JSON.stringify(tasks)).not.toMatch(/"title"\s*:/);
      }

      await assertLiteDeny(request, "/api/v1/admin/metrics/overview", client);
      await assertLiteDeny(request, "/api/v1/media/upload-sessions", client);
      await assertLiteDeny(request, "/api/v1/devices", client);
      await assertLiteDeny(request, "/api/projects", client);

      // Sibling / near-match bypass attempts
      for (const sibling of [
        "/api/v1/worker-evil",
        "/api/v1/workers",
        "/api/v1/sync-evil",
        "/api/v1/devices-admin",
        "/api/v1/admin/metrics",
      ]) {
        await assertLiteDeny(request, sibling, client, deviceId);
      }
    }
  });
});
