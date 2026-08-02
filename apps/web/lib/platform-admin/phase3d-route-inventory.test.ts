import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PHASE3D_FORBIDDEN_MUTATION_PATH_PATTERNS,
  PHASE3D_LEGACY_ROMA_REDIRECTS,
  PHASE3D_OPERATIONS_CENTER_PATHS,
  PHASE3D_PLATFORM_CABINET_PATHS,
  PHASE3D_REQUIRED_READ_APIS,
  PHASE3D_SAFE_AUDIT_REFRESH_PATH,
  classifyPlatformApiPath,
} from "./phase3d-route-inventory";
import {
  SAFE_AUDIT_REFRESH_SEMANTICS,
  SAFE_AUDIT_SAVE_SEMANTICS,
  describeOperationsCenterMutationPolicy,
} from "./phase3d-safe-audit-taxonomy";
import { OWNER_READONLY_ALLOWED_POST_PATH } from "@/lib/platform-owner/owner-capabilities";

const webRoot = join(import.meta.dirname, "../..");

function walkRouteFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkRouteFiles(full, out);
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

describe("Phase 3D route inventory", () => {
  it("lists platform cabinet and Operations Center canonical paths", () => {
    expect(PHASE3D_PLATFORM_CABINET_PATHS).toContain("/platform-admin");
    expect(PHASE3D_OPERATIONS_CENTER_PATHS).toContain("/platform-admin/testing");
    expect(PHASE3D_OPERATIONS_CENTER_PATHS).toContain("/platform-admin/testing/safe-audit");
    expect(PHASE3D_OPERATIONS_CENTER_PATHS).toContain("/platform-admin/testing/execution-engine");
    expect(PHASE3D_OPERATIONS_CENTER_PATHS.length).toBe(13);
  });

  it("maps legacy ROMA redirects exactly", () => {
    expect(PHASE3D_LEGACY_ROMA_REDIRECTS.audits).toBe("/platform-admin/testing/safe-audit");
    expect(PHASE3D_LEGACY_ROMA_REDIRECTS.history).toBe("/platform-admin/testing/audit-runs");
    expect(PHASE3D_LEGACY_ROMA_REDIRECTS.regression).toBe("/platform-admin/testing/change-intelligence");
    expect(PHASE3D_LEGACY_ROMA_REDIRECTS.coverage).toBe("/platform-admin/testing/quality-graph");
    expect(PHASE3D_LEGACY_ROMA_REDIRECTS.performance).toBe("/platform-admin/testing");
    expect(PHASE3D_LEGACY_ROMA_REDIRECTS.reports).toBe("/platform-admin/testing");
  });

  it("classifies safe-audit refresh as read_mode_post_exception and save as write", () => {
    expect(classifyPlatformApiPath(PHASE3D_SAFE_AUDIT_REFRESH_PATH, "POST")).toBe(
      "read_mode_post_exception"
    );
    expect(classifyPlatformApiPath("/api/v1/platform/testing/safe-audit/save", "POST")).toBe("write");
    expect(classifyPlatformApiPath("/api/v1/platform/critical/echo", "POST")).toBe("critical");
    expect(classifyPlatformApiPath("/api/v1/platform/overview", "GET")).toBe("read");
  });

  it("every platform route.ts calls requirePlatformOwnerApi before business logic", () => {
    const platformDir = join(webRoot, "app/api/v1/platform");
    const files = walkRouteFiles(platformDir);
    expect(files.length).toBeGreaterThanOrEqual(20);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).toMatch(/requirePlatformOwnerApi\s*\(/);
      const handlers = [...src.matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)/g)];
      expect(handlers.length, file).toBeGreaterThan(0);
      for (const match of handlers) {
        const start = match.index ?? 0;
        const slice = src.slice(start, start + 1200);
        expect(slice, `${file} ${match[1]}`).toMatch(/requirePlatformOwnerApi\s*\(/);
      }
    }
  });

  it("forbids required E2E from mutation patterns including save", () => {
    expect(PHASE3D_FORBIDDEN_MUTATION_PATH_PATTERNS).toContain(
      "/api/v1/platform/testing/safe-audit/save"
    );
    expect(PHASE3D_REQUIRED_READ_APIS.every((p) => p.startsWith("/api/v1/platform/"))).toBe(true);
  });
});

describe("Phase 3D safe-audit taxonomy", () => {
  it("documents refresh non-persistence and save persistence", () => {
    expect(SAFE_AUDIT_REFRESH_SEMANTICS.persistsRomaAuditRuns).toBe(false);
    expect(SAFE_AUDIT_SAVE_SEMANTICS.persistsRomaAuditRuns).toBe(true);
    expect(SAFE_AUDIT_REFRESH_SEMANTICS.path).toBe(OWNER_READONLY_ALLOWED_POST_PATH);
    const policy = describeOperationsCenterMutationPolicy();
    expect(policy.tenantBusinessMutations).toBe(false);
    expect(policy.requiredE2eMayCallSave).toBe(false);
  });

  it("refresh route source asserts no roma_audit_runs insert", () => {
    const refresh = readFileSync(
      join(webRoot, "app/api/v1/platform/testing/safe-audit/refresh/route.ts"),
      "utf8"
    );
    const save = readFileSync(
      join(webRoot, "app/api/v1/platform/testing/safe-audit/save/route.ts"),
      "utf8"
    );
    expect(refresh).toContain('mode: "read"');
    expect(refresh).not.toContain("saveAuditRunSnapshot");
    expect(save).toContain('mode: "write"');
    expect(save).toContain("saveAuditRunSnapshot");
  });
});

describe("Phase 3D Playwright no-soft-skip policy", () => {
  it("required phase3d specs do not call test.skip", () => {
    const dir = join(webRoot, "tests/phase3d");
    let files: string[] = [];
    try {
      files = readdirSync(dir)
        .filter((f) => f.endsWith(".spec.ts"))
        .map((f) => join(dir, f));
    } catch {
      // Directory may be created in the same batch; empty is fail until harness lands.
      expect(files.length, "phase3d specs must exist").toBeGreaterThan(0);
      return;
    }
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/\btest\.skip\s*\(/);
      expect(src, file).not.toMatch(/\btest\.fix\.skip\s*\(/);
    }
  });
});
