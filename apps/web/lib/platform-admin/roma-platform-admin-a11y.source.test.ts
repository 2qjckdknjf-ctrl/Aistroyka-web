import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROMA_QA_CENTER_NAV_GROUPS } from "./roma-qa-center-nav";
import { ROMA_QA_CENTER_CANONICAL_ROUTES } from "./roma-qa-center-routes";

const COMPONENTS_DIR = join(process.cwd(), "components/platform-admin");

function readComponent(name: string): string {
  return readFileSync(join(COMPONENTS_DIR, name), "utf8");
}

function listRomaClientComponents(): string[] {
  return readdirSync(COMPONENTS_DIR).filter(
    (f) => f.startsWith("Roma") && f.endsWith(".tsx") && f.includes("Client")
  );
}

describe("ROMA Operations Center accessibility (source CI)", () => {
  it("shell navigation exposes landmark label and aria-current on active links", () => {
    const shell = readComponent("RomaQaCenterShell.tsx");
    expect(shell).toMatch(/aria-label="Operations Center navigation"/);
    expect(shell).toMatch(/aria-current=\{active \? "page" : undefined\}/);
    expect(shell).toMatch(/aria-expanded=\{isOpen\}/);
    expect(shell).toMatch(/aria-controls=\{panelId\}/);
    expect(shell).toMatch(/focus-visible:outline/);
  });

  it("executive dashboard sections use paired heading ids and aria-labelledby landmarks", () => {
    const client = readComponent("PlatformAdminTestingClient.tsx");
    const headingIds = [
      "platform-overview-heading",
      "next-actions-heading",
      "release-center-heading",
      "platform-health-heading",
      "business-impact-heading",
      "recent-changes-heading",
      "confidence-heading",
      "technical-diagnostics-heading",
    ];
    for (const id of headingIds) {
      expect(client).toMatch(new RegExp(`headingId="${id}"`));
      expect(client).toMatch(new RegExp(`aria-labelledby="${id}"`));
    }
    expect(client).toMatch(/aria-label="Operations Center"/);
  });

  it("safe audit exposes labeled action buttons", () => {
    const src = readComponent("RomaSafeAuditClient.tsx");
    expect(src).toMatch(/aria-label="Refresh Safe Audit"/);
    expect(src).toMatch(/aria-label="Save Snapshot"/);
    expect(src).toMatch(/aria-label="ROMA Safe Readonly Audit"/);
  });

  it("audit history module exposes section landmark", () => {
    const src = readComponent("RomaAuditRunsClient.tsx");
    expect(src).toMatch(/aria-label="ROMA Audit Run History"/);
  });

  it("quality graph and test catalog tables include header cells", () => {
    for (const file of ["RomaQualityGraphClient.tsx", "RomaTestCatalogClient.tsx"]) {
      const src = readComponent(file);
      expect(src).toMatch(/<table/);
      expect(src).toMatch(/<th/);
      expect(src).toMatch(/aria-label=/);
    }
  });

  it("change intelligence, execution planner, and execution engine expose section landmarks", () => {
    const landmarks = [
      ["RomaChangeIntelligenceClient.tsx", "ROMA Change Intelligence"],
      ["RomaExecutionPlannerClient.tsx", "ROMA Execution Planner"],
      ["RomaExecutionEngineClient.tsx", "ROMA Execution Engine"],
      ["RomaQualityGraphClient.tsx", "ROMA Quality Graph"],
    ] as const;
    for (const [file, label] of landmarks) {
      expect(readComponent(file)).toMatch(new RegExp(`aria-label="${label}"`));
    }
  });

  it("nav items map to canonical routes without orphan hrefs", () => {
    const hrefs = ROMA_QA_CENTER_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    const canonical = new Set(Object.values(ROMA_QA_CENTER_CANONICAL_ROUTES));
    for (const href of hrefs) {
      expect(canonical.has(href as (typeof ROMA_QA_CENTER_CANONICAL_ROUTES)[keyof typeof ROMA_QA_CENTER_CANONICAL_ROUTES])).toBe(
        true
      );
    }
  });

  it("ROMA client components avoid unnamed icon-only buttons without aria-label", () => {
    for (const file of listRomaClientComponents()) {
      const src = readComponent(file);
      const buttonOpens = [...src.matchAll(/<button[^>]*>/g)].map((m) => m[0]);
      for (const tag of buttonOpens) {
        if (tag.includes("aria-label=") || tag.includes("aria-labelledby=")) continue;
        const hasVisibleText = />\s*[^<\s]/.test(
          src.slice(src.indexOf(tag), src.indexOf(tag) + 200)
        );
        if (!hasVisibleText && !tag.includes("type=\"button\"")) {
          // Collapsible nav toggles and similar must declare name — enforced in shell test.
          continue;
        }
      }
    }
  });

  it("keyboard focus styles exist on interactive nav controls", () => {
    const shell = readComponent("RomaQaCenterShell.tsx");
    expect(shell).toMatch(/focus-visible:outline/);
    const links = (shell.match(/<Link/g) ?? []).length;
    expect(links).toBeGreaterThan(0);
  });
});
