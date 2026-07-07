import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROMA_QA_CENTER_NAV_GROUPS, ROMA_QA_CENTER_NAV_ITEMS } from "./roma-qa-center-nav";
import {
  ROMA_QA_CENTER_ROUTE_SECTION_IDS,
  ROMA_QA_CENTER_SECTION_IDS,
  buildRomaQaCenterModel,
} from "./roma-qa-center.model";
import { ROMA_QA_CENTER_LEGACY_REDIRECTS } from "./roma-qa-center-routes";
import { isPlatformAdminPagePath } from "./middleware-paths";
import { PLATFORM_ADMIN_SHELL_NAV_ITEMS } from "./shell-nav";
import { isRomaQaCenterNavPath } from "./roma-qa-center-nav";

const ROOT = process.cwd();

function readRelative(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("ROMA QA Center", () => {
  it("defines grouped system map navigation with core ROMA routes", () => {
    expect(ROMA_QA_CENTER_SECTION_IDS).toHaveLength(6);
    expect(ROMA_QA_CENTER_NAV_GROUPS.length).toBe(5);
    expect(ROMA_QA_CENTER_NAV_ITEMS.length).toBe(13);
    expect(ROMA_QA_CENTER_NAV_ITEMS.some((item) => item.id === "quality-graph")).toBe(true);
    expect(ROMA_QA_CENTER_NAV_ITEMS.some((item) => item.id === "safe-audit")).toBe(true);
    expect(ROMA_QA_CENTER_NAV_ITEMS.some((item) => item.id === "audit-runs")).toBe(true);
    expect(ROMA_QA_CENTER_NAV_ITEMS.some((item) => item.label === "Audit History")).toBe(true);
    expect(ROMA_QA_CENTER_NAV_ITEMS.some((item) => item.id === "audits")).toBe(false);
    expect(ROMA_QA_CENTER_NAV_ITEMS.some((item) => item.id === "backend")).toBe(true);
  });

  it("protects all QA center routes via platform admin page path guard", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/quality-graph")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/test-catalog")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/change-intelligence")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/execution-planner")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/execution-engine")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/safe-audit")).toBe(true);
    expect(isPlatformAdminPagePath("/platform-admin/testing/audit-runs")).toBe(true);
    for (const section of ROMA_QA_CENTER_ROUTE_SECTION_IDS) {
      expect(isPlatformAdminPagePath(`/platform-admin/testing/${section}`)).toBe(true);
    }
    for (const legacy of Object.keys(ROMA_QA_CENTER_LEGACY_REDIRECTS)) {
      expect(isPlatformAdminPagePath(`/platform-admin/testing/${legacy}`)).toBe(true);
    }
    expect(isRomaQaCenterNavPath("/platform-admin/testing")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing")).toBe(false);
    expect(isPlatformAdminPagePath("/dashboard")).toBe(false);
  });

  it("shell nav labels ROMA QA Center (not tenant /admin)", () => {
    const qaNav = PLATFORM_ADMIN_SHELL_NAV_ITEMS.find((item) => item.href.endsWith("/testing"));
    expect(qaNav?.label).toBe("ROMA QA Center");
    expect(PLATFORM_ADMIN_SHELL_NAV_ITEMS.some((item) => item.href.startsWith("/admin"))).toBe(false);
  });

  it("platform section model has execution disabled and no fabricated audits", () => {
    const model = buildRomaQaCenterModel();
    expect(model.executionEnabled).toBe(false);
    expect(model.sections).toHaveLength(5);
    expect(model.sections.some((s) => s.id === "audits")).toBe(false);
    expect(model.sections.some((s) => s.id === "history")).toBe(false);

    for (const section of model.sections) {
      expect(section.status).not.toBe("available");
      expect(section.currentCapability).not.toMatch(/\d+\s+audits?\s+completed/i);
    }
  });

  it("section pages have no enabled Run/Execute/Deploy/Fix actions on dashboard", () => {
    const paths = [
      "components/platform-admin/RomaQaCenterSectionClient.tsx",
      "components/platform-admin/PlatformAdminTestingClient.tsx",
      "app/[locale]/(platform-admin)/platform-admin/testing/layout.tsx",
      "app/[locale]/(platform-admin)/platform-admin/testing/page.tsx",
      "app/[locale]/(platform-admin)/platform-admin/testing/[section]/page.tsx",
    ];
    const forbidden = [
      /<button[^>]*>\s*Run\s/i,
      /<button[^>]*>\s*Execute\s/i,
      /<button[^>]*>\s*Deploy\s/i,
      /<button[^>]*>\s*Fix\s/i,
      />\s*Run Full Audit\s*</i,
    ];
    for (const path of paths) {
      const src = readRelative(path);
      for (const pattern of forbidden) {
        expect(src, path).not.toMatch(pattern);
      }
    }
  });

  it("dashboard page still loads live quality dashboard builders", () => {
    const pageSrc = readRelative("app/[locale]/(platform-admin)/platform-admin/testing/page.tsx");
    expect(pageSrc).toMatch(/buildRomaQualityDashboard/);
    expect(pageSrc).toMatch(/buildRomaEngineeringIntelligence/);
    expect(pageSrc).toMatch(/PlatformAdminTestingClient/);
  });

  it("legacy section routes redirect to canonical modules", () => {
    const sectionPage = readRelative(
      "app/[locale]/(platform-admin)/platform-admin/testing/[section]/page.tsx"
    );
    expect(sectionPage).toMatch(/getRomaLegacyRedirectTarget/);
    expect(sectionPage).toMatch(/redirect\(/);
  });

  it("invalid section route uses notFound guard", () => {
    const sectionPage = readRelative(
      "app/[locale]/(platform-admin)/platform-admin/testing/[section]/page.tsx"
    );
    expect(sectionPage).toMatch(/isRomaQaCenterRouteSectionId/);
    expect(sectionPage).toMatch(/notFound\(\)/);
  });

  it("tenant admin cannot reach platform-admin testing via public /admin path", () => {
    expect(isPlatformAdminPagePath("/admin/testing")).toBe(false);
    expect(isPlatformAdminPagePath("/admin")).toBe(false);
  });
});
