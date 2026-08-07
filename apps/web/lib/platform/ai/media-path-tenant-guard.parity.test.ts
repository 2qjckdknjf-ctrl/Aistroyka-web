import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import * as tsGuard from "./media-path-tenant-guard";

const mjsPath = resolve(
  process.cwd(),
  process.cwd().endsWith("apps/web")
    ? "../../scripts/ops/lib/media-path-tenant-guard.mjs"
    : "scripts/ops/lib/media-path-tenant-guard.mjs"
);

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const projectA = "55555555-5555-4555-8555-555555555555";

describe("media-path-tenant-guard TS/MJS parity", async () => {
  const mjs = await import(mjsPath);

  const cases: string[] = [
    `${tenantA}/ok.jpg`,
    `media/${tenantA}/ok.jpg`,
    `media/media/${tenantA}/ok.jpg`,
    `${tenantB}/x.jpg`,
    `${projectA}/photo.jpg`,
    `${tenantA}/../${tenantB}/x.jpg`,
    `${tenantA}/%2e%2e/${tenantB}/x.jpg`,
    `${tenantA}/%252e%252e%252f${tenantB}/x.jpg`,
    `${tenantA}\\x.jpg`,
    `${tenantA}/file%.jpg`,
    `${tenantA}a/x.jpg`,
  ];

  it("assertMediaPathTenantScope and inspectMediaPathScope agree", () => {
    for (const raw of cases) {
      const a = tsGuard.assertMediaPathTenantScope(raw, tenantA);
      const b = mjs.assertMediaPathTenantScope(raw, tenantA);
      expect(b.ok).toBe(a.ok);
      if (a.ok && b.ok) {
        expect(b.bucketRelativePath).toBe(a.bucketRelativePath);
      } else if (!a.ok && !b.ok) {
        expect(b.code).toBe(a.code);
      }

      const ia = tsGuard.inspectMediaPathScope(raw, tenantA);
      const ib = mjs.inspectMediaPathScope(raw, tenantA);
      expect(ib.kind).toBe(ia.kind);
    }
  });
});
