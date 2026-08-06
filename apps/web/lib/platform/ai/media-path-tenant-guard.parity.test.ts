import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import * as tsGuard from "./media-path-tenant-guard";

const require = createRequire(import.meta.url);
// Load the ops ESM mirror via dynamic import path resolved from repo root.
const mjsPath = resolve(
  process.cwd(),
  process.cwd().endsWith("apps/web")
    ? "../../scripts/ops/lib/media-path-tenant-guard.mjs"
    : "scripts/ops/lib/media-path-tenant-guard.mjs"
);

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";

describe("media-path-tenant-guard TS/MJS parity", async () => {
  const mjs = await import(mjsPath);

  const cases: Array<{ raw: string; tenant: string; project?: string | null }> = [
    { raw: `${tenantA}/ok.jpg`, tenant: tenantA },
    { raw: `media/${tenantA}/ok.jpg`, tenant: tenantA },
    { raw: `media/media/${tenantA}/ok.jpg`, tenant: tenantA },
    { raw: `${tenantB}/x.jpg`, tenant: tenantA },
    { raw: `${tenantA}/../${tenantB}/x.jpg`, tenant: tenantA },
    { raw: `${tenantA}/%2e%2e/${tenantB}/x.jpg`, tenant: tenantA },
    { raw: `${tenantA}/%252e%252e%252f${tenantB}/x.jpg`, tenant: tenantA },
    { raw: `${tenantA}\\x.jpg`, tenant: tenantA },
    { raw: `${tenantA}/file%.jpg`, tenant: tenantA },
    { raw: `${tenantA}a/x.jpg`, tenant: tenantA },
  ];

  it("assertMediaPathTenantScope agrees for attack and valid vectors", () => {
    for (const c of cases) {
      const a = tsGuard.assertMediaPathTenantScope(c.raw, c.tenant, c.project ?? null);
      const b = mjs.assertMediaPathTenantScope(c.raw, c.tenant, c.project ?? null);
      expect(b.ok).toBe(a.ok);
      if (a.ok && b.ok) {
        expect(b.bucketRelativePath).toBe(a.bucketRelativePath);
      } else if (!a.ok && !b.ok) {
        expect(b.code).toBe(a.code);
      }
    }
    // silence unused require in some runners
    void require;
  });
});
