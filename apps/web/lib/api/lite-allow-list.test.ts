import { describe, expect, it } from "vitest";
import { checkLiteAllowList } from "./lite-allow-list";

describe("checkLiteAllowList", () => {
  it("returns null for web client", () => {
    expect(checkLiteAllowList("/api/v1/projects", "web")).toBeNull();
    expect(checkLiteAllowList("/api/v1/admin/jobs", "web")).toBeNull();
  });

  it("returns null for ios_full and android_full", () => {
    expect(checkLiteAllowList("/api/v1/projects", "ios_full")).toBeNull();
    expect(checkLiteAllowList("/api/v1/admin/jobs", "android_full")).toBeNull();
  });

  it("returns 403 for lite client on disallowed path", () => {
    const r = checkLiteAllowList("/api/v1/projects", "ios_lite");
    expect(r).not.toBeNull();
    expect(r!.status).toBe(403);
    expect(r!.body.code).toBe("lite_client_path_forbidden");
    expect(r!.body.error).toBe("forbidden");
  });

  it("returns 403 for android_lite on admin path", () => {
    const r = checkLiteAllowList("/api/v1/admin/ai/usage", "android_lite");
    expect(r).not.toBeNull();
    expect(r!.status).toBe(403);
  });

  it("returns null for lite client on allowed path /api/v1/config", () => {
    expect(checkLiteAllowList("/api/v1/config", "ios_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/worker/*", () => {
    expect(checkLiteAllowList("/api/v1/worker/tasks/today", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/worker", "android_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/sync/*", () => {
    expect(checkLiteAllowList("/api/v1/sync/bootstrap", "ios_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/media/upload-sessions*", () => {
    expect(checkLiteAllowList("/api/v1/media/upload-sessions", "ios_lite")).toBeNull();
    expect(checkLiteAllowList("/api/v1/media/upload-sessions/123/finalize", "android_lite")).toBeNull();
  });

  it("returns null for lite client on allowed path /api/v1/reports/:id/analysis-status", () => {
    expect(checkLiteAllowList("/api/v1/reports/abc-123/analysis-status", "ios_lite")).toBeNull();
  });

  it("returns 403 for lite on /api/v1/reports without analysis-status", () => {
    const r = checkLiteAllowList("/api/v1/reports/abc", "ios_lite");
    expect(r).not.toBeNull();
    expect(r!.status).toBe(403);
  });

  it("returns null for lite client on /api/v1/devices/*", () => {
    expect(checkLiteAllowList("/api/v1/devices/register", "ios_lite")).toBeNull();
  });

  it("ignores non-/api/v1 paths", () => {
    expect(checkLiteAllowList("/api/health", "ios_lite")).toBeNull();
  });
});
