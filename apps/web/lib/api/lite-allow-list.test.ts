import { describe, expect, it } from "vitest";
import { checkLiteAllowList } from "./lite-allow-list";

describe("checkLiteAllowList", () => {
  it("returns null for web client", () => {
    expect(checkLiteAllowList("/api/v1/projects", "GET", "web")).toBeNull();
    expect(checkLiteAllowList("/api/v1/admin/jobs", "GET", "web")).toBeNull();
  });

  it("returns null for ios_full and android_full", () => {
    expect(checkLiteAllowList("/api/v1/projects", "GET", "ios_full")).toBeNull();
    expect(checkLiteAllowList("/api/v1/admin/jobs", "GET", "android_full")).toBeNull();
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

  it("returns null for lite client on allowed path /api/v1/media/upload-sessions*", () => {
    expect(checkLiteAllowList("/api/v1/media/upload-sessions", "POST", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions/123/finalize", "POST", "android_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/reports/:id/analysis-status", () => {
    expect(checkLiteAllowList("/api/v1/reports/abc-123/analysis-status", "GET", "ios_lite")).toBeNull();
  });

  it("returns null for lite GET /api/v1/reports/:id (worker read scope enforced in route)", () => {
    expect(checkLiteAllowList("/api/v1/reports/abc", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/reports/abc", "PATCH", "ios_lite")).not.toBeNull();
  });

  it("returns null for lite GET /api/v1/tasks/:id (worker task detail)", () => {
    expect(checkLiteAllowList("/api/v1/tasks/task-uuid-1", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/tasks/task-uuid-1", "PATCH", "ios_lite")).not.toBeNull();
  });

  it("returns null for lite client on /api/v1/devices/*", () => {
    expect(checkLiteAllowList("/api/v1/devices/register", "POST", "ios_lite")).toBeNull();
  });

  it("returns null for lite activation + help paths (worker intelligence surfaces)", () => {
    expect(checkLiteAllowList("/api/v1/activation/status", "GET", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/help/hints", "POST", "android_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/help/assistant", "POST", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/help/assistant/events", "POST", "android_lite")).toBeNull();
  });

  it("returns 403 for lite on help paths with wrong method or extra help routes", () => {
    expect(checkLiteAllowList("/api/v1/activation/status", "POST", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/help/hints", "GET", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/help/query", "POST", "ios_lite")).not.toBeNull();
    expect(checkLiteAllowList("/api/v1/help/assistant/metrics", "GET", "android_lite")).not.toBeNull();
  });

  it("ignores non-/api/v1 paths", () => {
    expect(checkLiteAllowList("/api/health", "GET", "ios_lite")).toBeNull();
  });
});
