import { describe, expect, it } from "vitest";
import { redirectIfStakeholderBlockedPath } from "./stakeholder-dashboard-paths";

describe("redirectIfStakeholderBlockedPath", () => {
  const base = "https://app.example.com";

  it("redirects dashboard root to portal projects (portal-safe entry)", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("redirects project detail to client portal", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/projects/p1", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/dashboard/projects/p1/client");
  });

  it("allows projects list and client subtree", () => {
    expect(redirectIfStakeholderBlockedPath("/dashboard/projects", "en", base)).toBeNull();
    expect(redirectIfStakeholderBlockedPath("/dashboard/projects/p1/client", "en", base)).toBeNull();
    expect(redirectIfStakeholderBlockedPath("/dashboard/stakeholder-invite", "en", base)).toBeNull();
  });

  it("allows portal projects list and nested paths", () => {
    expect(redirectIfStakeholderBlockedPath("/portal/projects", "en", base)).toBeNull();
    expect(redirectIfStakeholderBlockedPath("/portal/projects/p1/extra", "en", base)).toBeNull();
  });

  it("redirects portal root to portal projects", () => {
    const r = redirectIfStakeholderBlockedPath("/portal", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("redirects unknown portal paths to portal projects", () => {
    const r = redirectIfStakeholderBlockedPath("/portal/other", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("blocks internal dashboard routes to portal home", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/tasks", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("blocks handover pack and costs under project (not /client)", () => {
    expect(
      redirectIfStakeholderBlockedPath("/dashboard/projects/p1/handover/pack", "en", base)?.headers.get(
        "location"
      )
    ).toBe("https://app.example.com/en/portal/projects");
    expect(
      redirectIfStakeholderBlockedPath("/dashboard/projects/p1/costs", "en", base)?.headers.get("location")
    ).toBe("https://app.example.com/en/portal/projects");
  });

  it("blocks alternate projects shell and billing to portal home", () => {
    expect(redirectIfStakeholderBlockedPath("/projects", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/portal/projects"
    );
    expect(redirectIfStakeholderBlockedPath("/billing", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/portal/projects"
    );
  });
});
