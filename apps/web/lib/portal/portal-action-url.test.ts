import { describe, expect, it } from "vitest";
import {
  portalActionHrefOrFallback,
  portalBackLinkForAudience,
  resolvePortalSafeActionUrl,
  shouldShowHandoverPackLink,
} from "./portal-action-url";

describe("resolvePortalSafeActionUrl", () => {
  it("allows client subtree and portal projects", () => {
    expect(resolvePortalSafeActionUrl("/dashboard/projects/p1/client")).toEqual({
      ok: true,
      href: "/dashboard/projects/p1/client",
    });
    expect(resolvePortalSafeActionUrl("/dashboard/projects/p1/client/discussions/d1")).toEqual({
      ok: true,
      href: "/dashboard/projects/p1/client/discussions/d1",
    });
    expect(resolvePortalSafeActionUrl("/portal/projects")).toEqual({
      ok: true,
      href: "/portal/projects",
    });
  });

  it("strips locale prefix", () => {
    expect(resolvePortalSafeActionUrl("/ru/dashboard/projects/p1/client")).toEqual({
      ok: true,
      href: "/dashboard/projects/p1/client",
    });
  });

  it("rejects protocol-relative and external schemes", () => {
    expect(resolvePortalSafeActionUrl("//evil.example/x").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("https://evil.example/x").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("javascript:alert(1)").ok).toBe(false);
  });

  it("rejects admin billing portfolio and internal project paths", () => {
    expect(resolvePortalSafeActionUrl("/admin/jobs").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("/billing").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("/portfolio").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("/dashboard/projects/p1").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("/dashboard/projects/p1/handover/pack").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("/dashboard/projects/p1?tab=costs").ok).toBe(false);
    expect(resolvePortalSafeActionUrl("/projects/p1").ok).toBe(false);
  });

  it("fallback helper returns portal home on deny", () => {
    expect(portalActionHrefOrFallback("/admin")).toBe("/portal/projects");
    expect(portalActionHrefOrFallback("/dashboard/projects/p1/client")).toBe(
      "/dashboard/projects/p1/client"
    );
  });
});

describe("portal audience link helpers", () => {
  it("selects back link by audience", () => {
    expect(portalBackLinkForAudience("stakeholder", "p1")).toBe("/portal/projects");
    expect(portalBackLinkForAudience("internal", "p1")).toBe("/dashboard/projects/p1");
  });

  it("hides handover pack for stakeholders", () => {
    expect(shouldShowHandoverPackLink("stakeholder")).toBe(false);
    expect(shouldShowHandoverPackLink("internal")).toBe(true);
  });
});
