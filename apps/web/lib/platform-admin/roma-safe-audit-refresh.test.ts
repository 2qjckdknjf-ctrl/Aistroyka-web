import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSafeReadonlyAuditMeta } from "./roma-safe-readonly-audit";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("ROMA Safe Audit Manual Refresh", () => {
  it("refresh API requires platform owner guard", () => {
    const src = readRelative("app/api/v1/platform/testing/safe-audit/refresh/route.ts");
    expect(src).toMatch(/requirePlatformOwnerApi/);
    expect(src).toMatch(/mode:\s*"read"/);
    expect(src).toMatch(/export async function POST/);
    expect(src).not.toMatch(/export async function GET/);
  });

  it("refresh API uses createSafeReadonlyAudit via buildSafeReadonlyAuditRefreshResponse", () => {
    const routeSrc = readRelative("app/api/v1/platform/testing/safe-audit/refresh/route.ts");
    expect(routeSrc).toMatch(/buildSafeReadonlyAuditRefreshResponse/);
    const auditSrc = readRelative("lib/platform-admin/roma-safe-readonly-audit.ts");
    expect(auditSrc).toMatch(/buildSafeReadonlyAuditRefreshResponse/);
    expect(auditSrc).toMatch(/createSafeReadonlyAudit\(\)/);
  });

  it("refresh API has no DB writes or CI/deploy calls", () => {
    const src = readRelative("app/api/v1/platform/testing/safe-audit/refresh/route.ts");
    expect(src).not.toMatch(/\.insert\s*\(/);
    expect(src).not.toMatch(/\.update\s*\(/);
    expect(src).not.toMatch(/\.delete\s*\(/);
    expect(src).not.toMatch(/workflow_dispatch/);
    expect(src).not.toMatch(/\bdeploy\s*\(/);
    expect(src).not.toMatch(/wrangler/);
  });

  it("non-owner blocked via requirePlatformOwnerApi fail-closed pattern", () => {
    const guardSrc = readRelative("lib/platform-owner/require-platform-owner-api.ts");
    expect(guardSrc).toMatch(/ok: false/);
    const routeSrc = readRelative("app/api/v1/platform/testing/safe-audit/refresh/route.ts");
    expect(routeSrc).toMatch(/if \(!auth\.ok\) return auth\.response/);
  });

  it("meta exposes refresh API path", () => {
    expect(getSafeReadonlyAuditMeta().refreshApiPath).toBe("/api/v1/platform/testing/safe-audit/refresh");
  });

  it("UI has Refresh Safe Audit button", () => {
    const ui = readRelative("components/platform-admin/RomaSafeAuditClient.tsx");
    expect(ui).toMatch(/Refresh Safe Audit/);
    expect(ui).toMatch(/refreshApiPath/);
    expect(ui).toMatch(/lastRefreshedAt/);
    expect(ui).toMatch(/loading/);
  });

  it("UI does not have Run Full Audit Execute Deploy or Fix", () => {
    const ui = readRelative("components/platform-admin/RomaSafeAuditClient.tsx");
    expect(ui).not.toMatch(/Run Full Audit/i);
    expect(ui).not.toMatch(/>\s*Execute\s*</i);
    expect(ui).not.toMatch(/>\s*Deploy\s*</i);
    expect(ui).not.toMatch(/>\s*Fix\s*</i);
    expect(ui).not.toMatch(/>\s*Run\s*</i);
  });

  it("tenant admin route cannot access safe audit page", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/safe-audit")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/safe-audit")).toBe(false);
  });

  it("refresh client calls owner-only platform API namespace", () => {
    const ui = readRelative("components/platform-admin/RomaSafeAuditClient.tsx");
    expect(ui).toMatch(/meta\.refreshApiPath/);
    expect(ui).toMatch(/method:\s*"POST"/);
    expect(ui).not.toMatch(/\/api\/v1\/admin\//);
    const meta = getSafeReadonlyAuditMeta();
    expect(meta.refreshApiPath).toMatch(/^\/api\/v1\/platform\//);
  });
});
