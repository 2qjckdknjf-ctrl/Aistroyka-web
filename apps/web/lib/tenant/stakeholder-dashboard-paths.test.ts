import { describe, expect, it } from "vitest";
import { redirectIfStakeholderBlockedPath } from "./stakeholder-dashboard-paths";

describe("redirectIfStakeholderBlockedPath", () => {
  const base = "https://app.example.com";

  it("redirects dashboard root to projects list", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/dashboard/projects");
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

  it("blocks internal dashboard routes", () => {
    const r = redirectIfStakeholderBlockedPath("/dashboard/tasks", "en", base);
    expect(r?.headers.get("location")).toBe("https://app.example.com/en/dashboard/projects");
  });

  it("blocks alternate projects shell and billing", () => {
    expect(redirectIfStakeholderBlockedPath("/projects", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/dashboard/projects"
    );
    expect(redirectIfStakeholderBlockedPath("/billing", "en", base)?.headers.get("location")).toBe(
      "https://app.example.com/en/dashboard/projects"
    );
  });
});
