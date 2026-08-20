import { describe, expect, it } from "vitest";
import { redirectIfStakeholderBlockedPath } from "./stakeholder-dashboard-paths";

describe("redirectIfStakeholderBlockedPath", () => {
  const base = "https://app.example.com";

  it("redirects dashboard root to portal projects", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/portal/projects");
  });

  it("redirects project detail to client portal", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/projects/p1", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/dashboard/projects/p1/client");
  });

  it("allows client subtree and invite", () => {
    expect(redirectIfStakeholderBlockedPath("/dashboard/projects/p1/client", "en", base)).toBeNull();
    expect(redirectIfStakeholderBlockedPath("/dashboard/stakeholder-invite", "en", base)).toBeNull();
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
});
