import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatPercent } from "./quality-dashboard-ui";
import { PLATFORM_ADMIN_SHELL_NAV_ITEMS } from "./shell-nav";
import { isPlatformAdminPagePath } from "./middleware-paths";

describe("ROMA live quality dashboard", () => {
  it("includes ROMA QA Center in shell navigation", () => {
    const testing = PLATFORM_ADMIN_SHELL_NAV_ITEMS.find((item) => item.href.endsWith("/testing"));
    expect(testing).toBeDefined();
    expect(testing?.label).toBe("ROMA QA Center");
  });

  it("treats /platform-admin/testing as platform admin page path", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing")).toBe(false);
  });

  it("formats unavailable percent as Unknown", () => {
    expect(formatPercent(null)).toBe("Unknown");
    expect(formatPercent(75)).toBe("75%");
  });

  it("testing client has no execution buttons or client fetch", () => {
    const clientPath = join(process.cwd(), "components/platform-admin/PlatformAdminTestingClient.tsx");
    const pagePath = join(
      process.cwd(),
      "app/[locale]/(platform-admin)/platform-admin/testing/page.tsx"
    );
    const clientSrc = readFileSync(clientPath, "utf8");
    const pageSrc = readFileSync(pagePath, "utf8");

    expect(clientSrc).not.toMatch(/\bfetch\s*\(/);
    expect(clientSrc).not.toMatch(/<button/i);
    expect(clientSrc).not.toMatch(/>\s*Run\s*</i);
    expect(clientSrc).not.toMatch(/>\s*Execute\s*</i);
    expect(clientSrc).not.toMatch(/>\s*Deploy\s*</i);
    expect(clientSrc).not.toMatch(/>\s*Restart\s*</i);
    expect(clientSrc).not.toMatch(/>\s*Delete\s*</i);
    expect(clientSrc).not.toMatch(/>\s*Fix\s*</i);
    expect(clientSrc).toMatch(/Operations Center/);
    expect(clientSrc).toMatch(/Next actions/);
    expect(clientSrc).toMatch(/Release center/);
    expect(clientSrc).toMatch(/Decision confidence/);
    expect(clientSrc).toMatch(/Technical diagnostics/);
    expect(clientSrc).toMatch(/buildPrioritizedActions/);
    expect(clientSrc).toMatch(/buildRecentChangesTimeline/);
    expect(clientSrc).toMatch(/recentAudits/);
    expect(pageSrc).toMatch(/buildRomaEngineeringIntelligence/);
    expect(pageSrc).toMatch(/listAuditRunSummaries/);
    expect(pageSrc).toMatch(/recentAudits={recentAudits}/);
    expect(clientSrc).not.toMatch(/\/admin\//);
  });

  it("quality API route is read-only GET under platform namespace", () => {
    const routePath = join(process.cwd(), "app/api/v1/platform/testing/quality/route.ts");
    const src = readFileSync(routePath, "utf8");
    expect(src).toMatch(/requirePlatformOwnerApi/);
    expect(src).toMatch(/export async function GET/);
    expect(src).not.toMatch(/export async function POST/);
    expect(src).not.toMatch(/export async function PUT/);
    expect(src).not.toMatch(/export async function DELETE/);
  });
});
