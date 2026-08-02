import { describe, expect, it } from "vitest";
import {
  forbidLiteOnLegacyRoute,
  isFieldWorkerClientHeader,
} from "./legacy-lite-guard";

const LITE_PROFILES = ["ios_lite", "android_lite", "ios_worker", "android_worker"] as const;

describe("legacy-lite-guard", () => {
  it("recognizes field-worker profiles case-insensitively with trim", () => {
    for (const profile of LITE_PROFILES) {
      expect(isFieldWorkerClientHeader(profile)).toBe(true);
      expect(isFieldWorkerClientHeader(` ${profile.toUpperCase()} `)).toBe(true);
    }
    expect(isFieldWorkerClientHeader("web")).toBe(false);
    expect(isFieldWorkerClientHeader("ios_full")).toBe(false);
    expect(isFieldWorkerClientHeader(null)).toBe(false);
    expect(isFieldWorkerClientHeader(undefined)).toBe(false);
    expect(isFieldWorkerClientHeader("")).toBe(false);
  });

  it("returns 403 lite_client_path_forbidden before any other work", () => {
    for (const profile of LITE_PROFILES) {
      const req = new Request("https://x/api/projects", {
        method: "POST",
        headers: { "x-client": `  ${profile.toUpperCase()}  `, "content-type": "application/json" },
        body: JSON.stringify({ name: "Evil" }),
      });
      const res = forbidLiteOnLegacyRoute(req);
      expect(res, profile).not.toBeNull();
      expect(res!.status).toBe(403);
      expect(res!.headers.get("location")).toBeNull();
    }
  });

  it("returns null for web and full clients", async () => {
    for (const client of ["web", "ios_full", "android_full"] as const) {
      const req = new Request("https://x/api/projects", {
        method: "POST",
        headers: { "x-client": client },
      });
      expect(forbidLiteOnLegacyRoute(req)).toBeNull();
    }
  });

  it("403 body matches contract", async () => {
    const req = new Request("https://x/api/ai/transcribe", {
      method: "POST",
      headers: { "x-client": "ios_lite" },
    });
    const res = forbidLiteOnLegacyRoute(req)!;
    const body = (await res.json()) as { error: string; code: string };
    expect(body).toEqual({ error: "forbidden", code: "lite_client_path_forbidden" });
  });
});
