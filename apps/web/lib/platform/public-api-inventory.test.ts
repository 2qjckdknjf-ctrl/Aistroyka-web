import { describe, expect, it } from "vitest";
import {
  PUBLIC_API_CATEGORIES,
  PUBLIC_API_EXAMPLE_ROUTES,
  publicApiStatusKey,
} from "./public-api-inventory";

describe("public-api-inventory", () => {
  it("maps readiness to i18n status keys", () => {
    expect(publicApiStatusKey("live")).toBe("statusLive");
    expect(publicApiStatusKey("partial")).toBe("statusPartial");
    expect(publicApiStatusKey("planned")).toBe("statusPlanned");
  });

  it("keeps six API categories with conservative readiness labels", () => {
    expect(PUBLIC_API_CATEGORIES).toHaveLength(6);
    const liveCount = PUBLIC_API_CATEGORIES.filter((c) => c.readiness === "live").length;
    expect(liveCount).toBe(3);
  });

  it("lists illustrative routes under /api/v1", () => {
    for (const route of PUBLIC_API_EXAMPLE_ROUTES) {
      expect(route).toMatch(/^GET |^POST /);
      expect(route).toContain("/api/v1/");
    }
  });
});
