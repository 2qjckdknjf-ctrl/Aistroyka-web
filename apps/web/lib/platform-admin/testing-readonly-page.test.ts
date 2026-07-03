import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLATFORM_ADMIN_SHELL_NAV_ITEMS } from "./shell-nav";
import { PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT } from "./testing-readonly-snapshot";
import { isPlatformAdminPagePath } from "./middleware-paths";

describe("platform-admin testing read-only page", () => {
  it("includes ROMA Testing in shell navigation", () => {
    const testing = PLATFORM_ADMIN_SHELL_NAV_ITEMS.find((item) => item.href.endsWith("/testing"));
    expect(testing).toBeDefined();
    expect(testing?.label).toMatch(/ROMA Testing/i);
  });

  it("marks test execution as disabled in static snapshot", () => {
    expect(PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT.pageMode).toBe("read_only");
    expect(PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT.testExecutionEnabled).toBe(false);
  });

  it("includes required status sections and evidence refs", () => {
    const s = PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT;
    expect(s.overallTesting.title).toBeTruthy();
    expect(s.platformAdminSecurity.title).toBeTruthy();
    expect(s.romaFramework.title).toBeTruthy();
    expect(s.releaseReadiness.title).toBeTruthy();
    expect(s.knownBlockers.length).toBeGreaterThan(0);
    expect(s.nextSafeAction.length).toBeGreaterThan(0);
    const paths = s.evidenceReports.map((r) => r.path);
    expect(paths).toContain("docs/audits/PLATFORM_ADMIN_NO_TAIL_AUDIT.md");
    expect(paths).toContain("docs/roma/ROMA_MERGE_TRACKER.md");
  });

  it("treats /platform-admin/testing as platform admin page path", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing")).toBe(false);
  });

  it("testing client has no fetch calls or execution buttons", () => {
    const clientPath = join(
      process.cwd(),
      "components/platform-admin/PlatformAdminTestingClient.tsx"
    );
    const src = readFileSync(clientPath, "utf8");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/<button/i);
    expect(src).not.toMatch(/Run (test|suite|smoke)/i);
    expect(src).not.toMatch(/Execute/i);
    expect(src).not.toMatch(/Start test/i);
    expect(src).not.toMatch(/\/api\/v1\/platform\/testing/);
  });
});
