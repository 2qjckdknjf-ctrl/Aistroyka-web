import { describe, expect, it } from "vitest";
import { redirectIfStakeholderBlockedPath, stakeholderGateUnavailableResponse } from "./stakeholder-dashboard-paths";

describe("redirectIfStakeholderBlockedPath", () => {
  const base = "https://app.example.com";

  it("redirects dashboard root to portal projects", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("redirects contractor projects list to portal projects", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/projects", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("redirects project detail to client portal", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/projects/p1", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/dashboard/projects/p1/client");
  });

  it("allows client subtree and invite", () => {
    expect(redirectIfStakeholderBlockedPath("/dashboard/projects/p1/client", "en", base)).toBeNull();
    expect(
      redirectIfStakeholderBlockedPath("/dashboard/projects/p1/client/handover/pack", "en", base)
    ).toBeNull();
    expect(redirectIfStakeholderBlockedPath("/dashboard/stakeholder-invite", "en", base)).toBeNull();
  });

  it("blocks manager-only handover pack outside client subtree", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/projects/p1/handover/pack", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
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

  it("blocks internal dashboard routes", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/tasks", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("blocks alternate projects shell and billing", () => {
    expect(redirectIfStakeholderBlockedPath("/projects", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/portal/projects"
    );
    expect(redirectIfStakeholderBlockedPath("/billing", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/portal/projects"
    );
  });

  it("blocks team management for portal-only stakeholders", () => {
    expect(redirectIfStakeholderBlockedPath("/team", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/portal/projects"
    );
    expect(redirectIfStakeholderBlockedPath("/team/invite", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/portal/projects"
    );
  });
});

describe("stakeholderGateUnavailableResponse", () => {
  const base = "https://app.example.com";

  it("answers contractor-only paths with a no-store 503 rewrite", () => {
    for (const path of ["/dashboard", "/dashboard/projects/p1", "/dashboard/tasks", "/admin", "/billing", "/portfolio"]) {
      const r = stakeholderGateUnavailableResponse(path, "ru", base);
      expect(r?.status).toBe(503);
      expect(r?.headers.get("x-middleware-rewrite")).toBe("https://app.example.com/ru/access-check-unavailable");
      expect(r?.headers.get("cache-control")).toContain("no-store");
    }
  });

  it("lets stakeholder-safe paths through", () => {
    expect(stakeholderGateUnavailableResponse("/portal/projects", "en", base)).toBeNull();
    expect(stakeholderGateUnavailableResponse("/dashboard/projects/p1/client", "en", base)).toBeNull();
    expect(stakeholderGateUnavailableResponse("/dashboard/stakeholder-invite", "en", base)).toBeNull();
  });
});
