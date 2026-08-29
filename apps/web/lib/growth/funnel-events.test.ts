import { describe, expect, it } from "vitest";
import { funnelEventForPath } from "./funnel-events";

describe("funnelEventForPath", () => {
  it("maps existing public routes only", () => {
    expect(funnelEventForPath("/en")).toBe("landing_page.viewed");
    expect(funnelEventForPath("/")).toBe("landing_page.viewed");
    expect(funnelEventForPath("/es/solutions")).toBe("solution.viewed");
    expect(funnelEventForPath("/ru/pricing?utm_source=google")).toBe("pricing.viewed");
    expect(funnelEventForPath("/en/docs")).toBeNull();
    expect(funnelEventForPath("/it/privacy")).toBeNull();
    expect(funnelEventForPath("/en/docs/getting-started")).toBeNull();
  });
});
