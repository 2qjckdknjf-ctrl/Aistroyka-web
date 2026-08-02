import { expect, test } from "@playwright/test";
import {
  authPasswordGrant,
  expectLiteForbidden,
  me,
  mobileHeaders,
  personaCredentials,
  requiredFixture,
  type MobileProfile,
} from "./helpers";

const fieldProfiles: MobileProfile[] = ["ios_worker", "android_worker", "ios_lite", "android_lite"];
const managerProfiles: MobileProfile[] = ["ios_manager", "android_manager"];

const forbiddenGets = [
  "/api/v1/admin/metrics/overview",
  "/api/v1/platform/health",
  "/api/v1/billing/overview",
  "/api/v1/ai/requests",
  "/api/v1/devices",
  "/api/v1/media/upload-sessions",
  "/api/projects",
  "/api/projects/sibling-proof",
  "/api/ai",
  "/api/ai/analyze-image",
] as const;

const siblingBypasses = [
  "/api/v1/admin2/metrics/overview",
  "/api/v1/platform-admin/health",
  "/api/v1/billing2/overview",
  "/api/v1/ai-tools/requests",
  "/api/v1/devices-admin",
  "/api/v1/devices2",
  "/api/v1/media/upload-sessions-old",
  "/api/v1/media/upload-sessions2",
  "/api/v1/worker-evil",
  "/api/v1/sync-evil",
] as const;

test.describe("Phase 4 field-worker lite isolation", () => {
  test("field-worker profiles receive exact lite denial on forbidden and sibling paths", async ({ request }) => {
    const fixture = requiredFixture();
    const worker = await authPasswordGrant(request, personaCredentials("workerA"));
    await me(request, worker.accessToken);

    for (const profile of fieldProfiles) {
      for (const path of forbiddenGets) {
        const res = await request.get(path, {
          headers: mobileHeaders(profile, { accessToken: worker.accessToken, deviceId: `${fixture.deviceA}-${profile}` }),
        });
        await expectLiteForbidden(res, `${profile} GET ${path}`);
      }

      for (const path of siblingBypasses) {
        const res = await request.get(path, {
          headers: mobileHeaders(profile, { accessToken: worker.accessToken, deviceId: `${fixture.deviceA}-${profile}` }),
        });
        await expectLiteForbidden(res, `${profile} sibling ${path}`);
      }
    }
  });

  test("manager profiles are not classified as lite on manager-allowed paths", async ({ request }) => {
    const fixture = requiredFixture();
    const manager = await authPasswordGrant(request, personaCredentials("manager"));
    await me(request, manager.accessToken);

    for (const profile of managerProfiles) {
      const headers = mobileHeaders(profile, {
        accessToken: manager.accessToken,
        deviceId: `${fixture.deviceA}-${profile}-allowed`,
      });

      const tasks = await request.get(`/api/v1/tasks?project_id=${fixture.projectId}&limit=5`, { headers });
      expect(tasks.status(), `${profile} manager tasks`).toBe(200);
      const uploadSessions = await request.get("/api/v1/media/upload-sessions?limit=1", { headers });
      expect(uploadSessions.status(), `${profile} upload session inventory`).not.toBe(403);
      const body = await uploadSessions.json().catch(() => ({}));
      expect(JSON.stringify(body)).not.toContain("lite_client_path_forbidden");
    }
  });
});
