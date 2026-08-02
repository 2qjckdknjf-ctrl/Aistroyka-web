import { describe, expect, it } from "vitest";
import { checkLiteAllowList } from "./lite-allow-list";

const LITE_PROFILES = ["ios_lite", "android_lite", "ios_worker", "android_worker"] as const;

describe("checkLiteAllowList", () => {
  it("returns null for web client", () => {
    expect(checkLiteAllowList("/api/v1/projects", "GET", "web")).toBeNull();
    expect(checkLiteAllowList("/api/v1/admin/jobs", "GET", "web")).toBeNull();
  });

  it("returns null for ios_full and android_full", () => {
    expect(checkLiteAllowList("/api/v1/projects", "GET", "ios_full")).toBeNull();
    expect(checkLiteAllowList("/api/v1/admin/jobs", "GET", "android_full")).toBeNull();
  });

  it("does not classify manager profiles as lite clients", () => {
    for (const profile of ["ios_manager", "android_manager"] as const) {
      expect(checkLiteAllowList("/api/v1/admin/metrics/overview", "GET", profile)).toBeNull();
      expect(checkLiteAllowList("/api/v1/billing/overview", "GET", profile)).toBeNull();
      expect(checkLiteAllowList("/api/v1/ai/requests", "GET", profile)).toBeNull();
      expect(checkLiteAllowList("/api/projects", "GET", profile)).toBeNull();
    }
  });

  it("returns null for lite client GET /api/v1/projects (worker project list)", () => {
    expect(checkLiteAllowList("/api/v1/projects", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/projects", "GET", "android_lite")).toBeNull();
  });

  it("returns 403 for lite client POST /api/v1/projects", () => {
    const r = checkLiteAllowList("/api/v1/projects", "POST", "ios_lite");
    expect(r).not.toBeNull();
    expect(r!.status).toBe(403);
    expect(r!.body.code).toBe("lite_client_path_forbidden");
  });

  it("returns 403 for android_lite on admin path", () => {
    const r = checkLiteAllowList("/api/v1/admin/ai/usage", "GET", "android_lite");
    expect(r).not.toBeNull();
    expect(r!.status).toBe(403);
  });

  it("returns null for lite client on allowed path /api/v1/config", () => {
    expect(checkLiteAllowList("/api/v1/config", "GET", "ios_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/worker/*", () => {
    expect(checkLiteAllowList("/api/v1/worker/tasks/today", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/worker", "GET", "android_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/sync/*", () => {
    expect(checkLiteAllowList("/api/v1/sync/bootstrap", "GET", "ios_lite")).toBeNull();
  });

  it("allows lite/worker GET /api/v1/me for session bootstrap", () => {
    expect(checkLiteAllowList("/api/v1/me", "GET", "ios_worker")).toBeNull();
    expect(checkLiteAllowList("/api/v1/me", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/me", "POST", "ios_worker")).not.toBeNull();
  });

  it("allows lite upload-session writes but blocks the manager list", () => {
    expect(checkLiteAllowList("/api/v1/media/upload-sessions", "POST", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions/123/finalize", "POST", "android_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions", "GET", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions", "GET", "android_worker")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions/", "GET", "ios_worker")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions", "HEAD", "android_lite")).not.toBeNull();
  });

  it("allows only GET for lite /api/v1/reports/:id/analysis-status", () => {
    expect(checkLiteAllowList("/api/v1/reports/abc-123/analysis-status", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/reports/abc-123/analysis-status", "POST", "ios_lite")).not.toBeNull();
  });

  it("returns null for lite GET /api/v1/reports/:id (worker read scope enforced in route)", () => {
    expect(checkLiteAllowList("/api/v1/reports/abc", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/reports/abc", "PATCH", "ios_lite")).not.toBeNull();
  });

  it("returns null for lite GET /api/v1/tasks/:id (worker task detail)", () => {
    expect(checkLiteAllowList("/api/v1/tasks/task-uuid-1", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/tasks/task-uuid-1", "PATCH", "ios_lite")).not.toBeNull();
  });

  it("allows lite device writes but blocks the manager inventory", () => {
    expect(checkLiteAllowList("/api/v1/devices/register", "POST", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/devices/unregister", "POST", "android_worker")).toBeNull();
    expect(checkLiteAllowList("/api/v1/devices", "GET", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/devices", "GET", "android_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/devices/", "GET", "ios_worker")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/devices", "HEAD", "android_worker")).not.toBeNull();
  });

  it("returns null for lite activation + help paths (worker intelligence surfaces)", () => {
    expect(checkLiteAllowList("/api/v1/activation/status", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/help/hints", "POST", "android_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/help/assistant", "POST", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/help/assistant/events", "POST", "android_lite")).toBeNull();
  });

  it("returns 403 for lite client on manager AI routes (copilot, intelligence, analyze-image)", () => {
    const blocked = [
      ["/api/v1/projects/p1/copilot", "GET"],
      ["/api/v1/projects/p1/copilot/chat/stream", "POST"],
      ["/api/v1/projects/p1/intelligence", "GET"],
      ["/api/v1/ai/analyze-image", "POST"],
      ["/api/v1/ai/memory/context", "GET"],
    ] as const;
    for (const [path, method] of blocked) {
      const r = checkLiteAllowList(path, method, "ios_lite");
      expect(r, `${method} ${path}`).not.toBeNull();
      expect(r!.status).toBe(403);
      expect(r!.body.code).toBe("lite_client_path_forbidden");
    }
  });

  it("returns 403 for lite on help paths with wrong method or extra help routes", () => {
    expect(checkLiteAllowList("/api/v1/activation/status", "POST", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/help/hints", "GET", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/help/query", "POST", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/help/assistant/metrics", "GET", "android_lite")).not.toBeNull();
  });

  it("ignores non-/api/v1 paths that are not legacy projects/ai families", () => {
    expect(checkLiteAllowList("/api/health", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/analysis/process", "POST", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/activation/status", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/tenant/invite", "POST", "ios_lite")).toBeNull();
  });

  it("forbids legacy /api/projects and /api/ai families for all field-worker profiles", () => {
    const legacy = [
      ["/api/projects", "GET"],
      ["/api/projects", "POST"],
      ["/api/projects", "HEAD"],
      ["/api/projects/", "GET"],
      ["/api/projects/", "HEAD"],
      ["/api/projects/p1", "GET"],
      ["/api/projects/p1/upload", "POST"],
      ["/api/ai", "POST"],
      ["/api/ai/", "POST"],
      ["/api/ai/", "HEAD"],
      ["/api/ai/transcribe", "POST"],
      ["/api/ai/analyze-image", "POST"],
    ] as const;
    for (const profile of LITE_PROFILES) {
      for (const [path, method] of legacy) {
        const r = checkLiteAllowList(path, method, profile);
        expect(r, `${profile} ${method} ${path}`).not.toBeNull();
        expect(r!.status).toBe(403);
        expect(r!.body.code).toBe("lite_client_path_forbidden");
      }
    }
  });

  it("does not classify sibling prefixes of legacy projects/ai as protected families", () => {
    for (const path of ["/api/project", "/api/projectsz", "/api/projects-old", "/api/aix", "/api/ai-tools"]) {
      for (const profile of LITE_PROFILES) {
        expect(checkLiteAllowList(path, "GET", profile), `${profile} ${path}`).toBeNull();
      }
    }
  });

  it("keeps exact worker and real sync/auth descendants allowed for all field-worker profiles", () => {
    const allowed = [
      ["/api/v1/worker", "GET"],
      ["/api/v1/worker/tasks/today", "GET"],
      ["/api/v1/worker/report/create", "POST"],
      ["/api/v1/sync/bootstrap", "GET"],
      ["/api/v1/sync/changes", "GET"],
      ["/api/v1/sync/ack", "POST"],
      ["/api/v1/auth/login", "POST"],
      ["/api/v1/auth/methods", "GET"],
      ["/api/v1/auth/telegram", "POST"],
    ] as const;
    for (const profile of LITE_PROFILES) {
      for (const [path, method] of allowed) {
        expect(checkLiteAllowList(path, method, profile), `${profile} ${method} ${path}`).toBeNull();
      }
    }
  });

  it("forbids sibling-prefix bypass paths for all field-worker profiles", () => {
    const siblings = [
      "/api/v1/worker-evil",
      "/api/v1/worker2",
      "/api/v1/workers",
      "/api/v1/workers-admin",
      "/api/v1/sync-evil",
      "/api/v1/sync2",
      "/api/v1/media/upload-sessions-old",
      "/api/v1/media/upload-sessions2",
      "/api/v1/devices-admin",
      "/api/v1/devices2",
      "/api/v1/authz",
      "/api/v1/auth-evil",
    ] as const;
    for (const profile of LITE_PROFILES) {
      for (const path of siblings) {
        const r = checkLiteAllowList(path, "GET", profile);
        expect(r, `${profile} GET ${path}`).not.toBeNull();
        expect(r!.status).toBe(403);
        expect(r!.body.code).toBe("lite_client_path_forbidden");
      }
    }
  });

  it("does not classify /api/v1x or /api/v10 as /api/v1 for lite clients", () => {
    for (const profile of LITE_PROFILES) {
      expect(checkLiteAllowList("/api/v1x/admin/jobs", "GET", profile)).toBeNull();
      expect(checkLiteAllowList("/api/v10/admin/jobs", "GET", profile)).toBeNull();
    }
  });

  it("keeps web/full clients unaffected on sibling and non-v1 lookalikes", () => {
    const paths = [
      "/api/v1/worker-evil",
      "/api/v1/sync-evil",
      "/api/v1/authz",
      "/api/v1x/admin/jobs",
      "/api/v10/admin/jobs",
    ] as const;
    for (const path of paths) {
      expect(checkLiteAllowList(path, "GET", "web")).toBeNull();
      expect(checkLiteAllowList(path, "GET", "ios_full")).toBeNull();
      expect(checkLiteAllowList(path, "GET", "android_full")).toBeNull();
    }
  });

  it("trailing slash and HEAD do not reopen manager-only root reads", () => {
    for (const profile of LITE_PROFILES) {
      for (const path of ["/api/v1/devices", "/api/v1/devices/"] as const) {
        for (const method of ["GET", "HEAD"] as const) {
          const r = checkLiteAllowList(path, method, profile);
          expect(r, `${profile} ${method} ${path}`).not.toBeNull();
          expect(r!.status).toBe(403);
          expect(r!.body.code).toBe("lite_client_path_forbidden");
        }
      }
      for (const path of ["/api/v1/media/upload-sessions", "/api/v1/media/upload-sessions/"] as const) {
        for (const method of ["GET", "HEAD"] as const) {
          const r = checkLiteAllowList(path, method, profile);
          expect(r, `${profile} ${method} ${path}`).not.toBeNull();
          expect(r!.status).toBe(403);
          expect(r!.body.code).toBe("lite_client_path_forbidden");
        }
      }
      expect(checkLiteAllowList("/api/v1/media/upload-sessions", "POST", profile)).toBeNull();
      expect(checkLiteAllowList("/api/v1/media/upload-sessions/abc/finalize", "POST", profile)).toBeNull();
      expect(checkLiteAllowList("/api/v1/devices/register", "POST", profile)).toBeNull();
      expect(checkLiteAllowList("/api/v1/devices/unregister", "POST", profile)).toBeNull();
    }
  });
});
