import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("project detail primary navigation (PD-P1-04)", () => {
  it("renders one primary tablist and does not mount ProjectSubnav", () => {
    const source = readFileSync(
      resolve(__dirname, "DashboardProjectDetailClient.tsx"),
      "utf8"
    );
    expect(source).not.toMatch(/ProjectSubnav/);
    expect(source).toContain('data-testid="project-primary-nav"');
    expect(source).toContain("projectDetailTabHref");
    expect(source).toContain("router.replace");
    expect(source).toContain("<Tabs");
    expect(source).toContain("<TabPanel");

    const tabsSource = readFileSync(
      resolve(__dirname, "../../../../../../components/ui/Tabs.tsx"),
      "utf8"
    );
    expect(tabsSource).toContain('role="tablist"');
    expect(tabsSource).toContain('role="tab"');
    expect(tabsSource).toContain("aria-selected");
  });
});
