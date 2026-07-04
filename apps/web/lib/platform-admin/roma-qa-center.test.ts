import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROMA_QA_CENTER_NAV_ITEMS } from "./roma-qa-center-nav";
import {
  ROMA_QA_CENTER_ROUTE_SECTION_IDS,
  ROMA_QA_CENTER_SECTION_IDS,
  buildRomaQaCenterModel,
} from "./roma-qa-center.model";
import { isPlatformAdminPagePath } from "./middleware-paths";
import { PLATFORM_ADMIN_SHELL_NAV_ITEMS } from "./shell-nav";
import { isRomaQaCenterNavPath } from "./roma-qa-center-nav";

const ROOT = process.cwd();

function readRelative(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("ROMA QA Center V1", () => {
  it("defines all 12 section ids in nav", () => {
    expect(ROMA_QA_CENTER_SECTION_IDS).toHaveLength(12);
    expect(ROMA_QA_CENTER_NAV_ITEMS).toHaveLength(12);
    expect(ROMA_QA_CENTER_NAV_ITEMS.map((item) => item.id)).toEqual([...ROMA_QA_CENTER_SECTION_IDS]);
  });

  it("protects all QA center routes via platform admin page path guard", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing")).toBe(true);
    for (const section of ROMA_QA_CENTER_ROUTE_SECTION_IDS) {
      expect(isPlatformAdminPagePath(`/platform-admin/testing/${section}`)).toBe(true);
    }
    expect(isRomaQaCenterNavPath("/platform-admin/testing")).toBe(true);
    for (const section of ROMA_QA_CENTER_ROUTE_SECTION_IDS) {
      expect(isRomaQaCenterNavPath(`/platform-admin/testing/${section}`)).toBe(true);
    }
    expect(isPlatformAdminPagePath("/admin/testing")).toBe(false);
    expect(isPlatformAdminPagePath("/dashboard")).toBe(false);
  });

  it("shell nav labels ROMA QA Center (not tenant /admin)", () => {
    const qaNav = PLATFORM_ADMIN_SHELL_NAV_ITEMS.find((item) => item.href.endsWith("/testing"));
    expect(qaNav?.label).toBe("ROMA QA Center");
    expect(PLATFORM_ADMIN_SHELL_NAV_ITEMS.some((item) => item.href.startsWith("/admin"))).toBe(false);
  });

  it("model has execution disabled and does not fabricate completed audits", () => {
    const model = buildRomaQaCenterModel();
    expect(model.executionEnabled).toBe(false);

    const audits = model.sections.find((s) => s.id === "audits");
    expect(audits?.status).toBe("coming_soon");
    expect(audits?.maturity).toBe("planned");
    expect(audits?.currentCapability).not.toMatch(/completed|passed|success/i);

    const history = model.sections.find((s) => s.id === "history");
    expect(history?.sourceAvailability).toMatch(/not available/i);
    expect(history?.currentCapability).toMatch(/no historical runs/i);

    for (const section of model.sections) {
      if (section.id === "dashboard") continue;
      expect(section.status).not.toBe("available");
      expect(section.currentCapability).not.toMatch(/\d+\s+audits?\s+completed/i);
    }

    const dashboard = model.sections.find((s) => s.id === "dashboard");
    expect(dashboard?.status).toBe("unknown");
  });

  it("section pages and shell have no enabled Run/Execute/Deploy/Fix actions", () => {
    const paths = [
      "components/platform-admin/RomaQaCenterShell.tsx",
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

  it("tenant admin cannot reach platform-admin testing via public /admin path", () => {
    expect(isPlatformAdminPagePath("/admin/testing")).toBe(false);
    expect(isPlatformAdminPagePath("/admin")).toBe(false);
  });

  it("invalid section route uses notFound guard", () => {
    const sectionPage = readRelative(
      "app/[locale]/(platform-admin)/platform-admin/testing/[section]/page.tsx"
    );
    expect(sectionPage).toMatch(/isRomaQaCenterRouteSectionId/);
    expect(sectionPage).toMatch(/notFound\(\)/);
  });
});
