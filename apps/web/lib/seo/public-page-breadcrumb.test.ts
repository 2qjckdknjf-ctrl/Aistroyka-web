import { describe, expect, it } from "vitest";
import { buildStandardPublicBreadcrumb } from "./public-page-breadcrumb";

describe("buildStandardPublicBreadcrumb", () => {
  it("returns a single home item on the homepage", () => {
    const schema = buildStandardPublicBreadcrumb("en", "", "Home", "Home");
    const items = schema.itemListElement as Array<{ position: number; name: string }>;
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Home");
    expect(items[0]?.position).toBe(1);
  });

  it("returns home and current page for inner routes", () => {
    const schema = buildStandardPublicBreadcrumb("ru", "/security", "Security", "Home");
    const items = schema.itemListElement as Array<{ position: number; name: string; item: string }>;
    expect(items).toHaveLength(2);
    expect(items[1]?.name).toBe("Security");
    expect(items[1]?.item).toMatch(/\/ru\/security$/);
  });
});
