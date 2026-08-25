import { describe, expect, it } from "vitest";
import { sanitizeNextRoute, resolvePostAuthEntry } from "./entry-routing";

const BASE = "https://aistroyka.ai/en/login";

describe("sanitizeNextRoute", () => {
  it("accepts locale-prefixed dashboard path", () => {
    expect(sanitizeNextRoute("/en/dashboard", BASE)).toBe("/en/dashboard");
    expect(sanitizeNextRoute("/ru/dashboard", BASE)).toBe("/ru/dashboard");
    expect(sanitizeNextRoute("/es/projects", BASE)).toBe("/es/projects");
  });

  it("accepts locale-prefixed safe paths", () => {
    expect(sanitizeNextRoute("/en/projects", BASE)).toBe("/en/projects");
    expect(sanitizeNextRoute("/en/portfolio", BASE)).toBe("/en/portfolio");
    expect(sanitizeNextRoute("/en/team", BASE)).toBe("/en/team");
    expect(sanitizeNextRoute("/en/settings", BASE)).toBe("/en/settings");
    expect(sanitizeNextRoute("/en/invite", BASE)).toBe("/en/invite");
    expect(sanitizeNextRoute("/en/billing", BASE)).toBe("/en/billing");
    expect(sanitizeNextRoute("/en/admin", BASE)).toBe("/en/admin");
    expect(sanitizeNextRoute("/ru/platform-admin", BASE)).toBe("/ru/platform-admin");
    expect(sanitizeNextRoute("/ru/platform-admin/testing", BASE)).toBe("/ru/platform-admin/testing");
    expect(sanitizeNextRoute("/en/owner", BASE)).toBe("/en/owner");
  });

  it("accepts path without locale and prepends locale", () => {
    expect(sanitizeNextRoute("/dashboard", BASE, "en")).toBe("/en/dashboard");
    expect(sanitizeNextRoute("/invite/accept", BASE, "ru")).toBe("/ru/invite/accept");
    expect(sanitizeNextRoute("/projects/new", BASE, "es")).toBe("/es/projects/new");
  });

  it("preserves query string for invite flow", () => {
    expect(sanitizeNextRoute("/en/invite/accept?token=abc", BASE)).toBe("/en/invite/accept?token=abc");
    expect(sanitizeNextRoute("/invite/accept?token=xyz", BASE, "en")).toBe("/en/invite/accept?token=xyz");
    expect(sanitizeNextRoute("/ru/subscribe?plan=pro", BASE)).toBe("/ru/subscribe?plan=pro");
    expect(sanitizeNextRoute("/subscribe?plan=starter", BASE, "en")).toBe("/en/subscribe?plan=starter");
  });

  it("rejects protocol-relative URLs (open redirect)", () => {
    expect(sanitizeNextRoute("//evil.com/path", BASE)).toBeNull();
    expect(sanitizeNextRoute("//evil.com", BASE)).toBeNull();
  });

  it("rejects external URLs", () => {
    expect(sanitizeNextRoute("https://evil.com/en/dashboard", BASE)).toBeNull();
    expect(sanitizeNextRoute("http://evil.com/en/dashboard", BASE)).toBeNull();
  });

  it("rejects non-path strings", () => {
    expect(sanitizeNextRoute("", BASE)).toBeNull();
    expect(sanitizeNextRoute("dashboard", BASE)).toBeNull();
    expect(sanitizeNextRoute(null, BASE)).toBeNull();
    expect(sanitizeNextRoute(undefined, BASE)).toBeNull();
  });

  it("rejects paths with backslash", () => {
    expect(sanitizeNextRoute("/en/dashboard\\evil", BASE)).toBeNull();
  });

  it("rejects unsafe internal paths", () => {
    expect(sanitizeNextRoute("/en/api/secret", BASE)).toBeNull();
    expect(sanitizeNextRoute("/en/random", BASE)).toBeNull();
  });

  it("rejects invalid locale in path", () => {
    expect(sanitizeNextRoute("/xx/dashboard", BASE)).toBeNull();
  });
});

describe("resolvePostAuthEntry", () => {
  it("returns explicit_next when next is valid and safe", () => {
    const r = resolvePostAuthEntry({ locale: "en", next: "/en/dashboard", baseUrl: BASE });
    expect(r.path).toBe("/en/dashboard");
    expect(r.reason).toBe("explicit_next");
    expect(r.nextPreserved).toBe(true);
    expect(r.onboardingShellExpected).toBe(true);
  });

  it("returns default_dashboard when next is absent", () => {
    const r = resolvePostAuthEntry({ locale: "en", next: undefined, baseUrl: BASE });
    expect(r.path).toBe("/en/dashboard");
    expect(r.reason).toBe("default_dashboard");
    expect(r.nextPreserved).toBe(false);
  });

  it("returns default_dashboard when next is invalid", () => {
    const r = resolvePostAuthEntry({ locale: "en", next: "//evil.com", baseUrl: BASE });
    expect(r.path).toBe("/en/dashboard");
    expect(r.reason).toBe("default_dashboard");
    expect(r.nextPreserved).toBe(false);
  });

  it("preserves locale in resolved path", () => {
    expect(resolvePostAuthEntry({ locale: "ru", next: undefined, baseUrl: BASE }).path).toBe("/ru/dashboard");
    expect(resolvePostAuthEntry({ locale: "es", next: undefined, baseUrl: BASE }).path).toBe("/es/dashboard");
  });

  it("falls back to default locale for invalid locale", () => {
    const r = resolvePostAuthEntry({ locale: "xx", next: undefined, baseUrl: BASE });
    expect(r.path).toBe("/ru/dashboard");
  });

  it("preserves legacy deep link for dashboard-ready user", () => {
    const r = resolvePostAuthEntry({ locale: "en", next: "/en/projects/123", baseUrl: BASE });
    expect(r.path).toBe("/en/projects/123");
    expect(r.reason).toBe("explicit_next");
    expect(r.nextPreserved).toBe(true);
  });

  it("preserves invite accept deep link", () => {
    const r = resolvePostAuthEntry({ locale: "en", next: "/invite/accept?token=abc", baseUrl: BASE });
    expect(r.path).toBe("/en/invite/accept?token=abc");
    expect(r.reason).toBe("explicit_next");
  });

  it("preserves platform-admin deep link after login", () => {
    const r = resolvePostAuthEntry({
      locale: "ru",
      next: "/ru/platform-admin/testing",
      baseUrl: "https://admin.aistroyka.ai/ru/login",
    });
    expect(r.path).toBe("/ru/platform-admin/testing");
    expect(r.reason).toBe("explicit_next");
  });
});
