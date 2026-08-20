import { describe, expect, it } from "vitest";
import { isDashboardNavHrefActive } from "@/components/dashboard-nav.utils";

describe("DashboardMobileNav active state", () => {
  it("highlights overview only on exact dashboard root", () => {
    expect(isDashboardNavHrefActive("/dashboard", "/dashboard")).toBe(true);
    expect(isDashboardNavHrefActive("/dashboard/projects", "/dashboard")).toBe(false);
  });

  it("highlights nested project routes under projects", () => {
    expect(isDashboardNavHrefActive("/dashboard/projects/abc", "/dashboard/projects")).toBe(true);
    expect(isDashboardNavHrefActive("/dashboard/tasks", "/dashboard/tasks")).toBe(true);
  });

  it("highlights portal home on client portal routes", () => {
    expect(isDashboardNavHrefActive("/dashboard/projects/abc/client/defects", "/portal/projects")).toBe(true);
  });
});
