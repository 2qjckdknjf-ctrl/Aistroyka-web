import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("admin/flags platform write gate", () => {
  it("POST uses requirePlatformOwnerApi write mode (not legacy grant-only helper)", () => {
    const src = readFileSync(join(import.meta.dirname, "route.ts"), "utf8");
    expect(src).toContain("requirePlatformOwnerApi");
    expect(src).toContain('mode: "write"');
    expect(src).not.toContain("requirePlatformOwnerLegacyAdminRoute");
  });
});
