import { describe, expect, it } from "vitest";
import { PUBLIC_PATHS_EXCLUDED_FROM_SITEMAP, PUBLIC_SITEMAP_PATHS } from "./public-paths";

describe("PUBLIC_SITEMAP_PATHS", () => {
  it("keeps mock demo marketing routes out of the sitemap", () => {
    expect(PUBLIC_SITEMAP_PATHS).not.toContain("/ai-demo");
    expect(PUBLIC_SITEMAP_PATHS).not.toContain("/copilot");
    expect(PUBLIC_PATHS_EXCLUDED_FROM_SITEMAP).toContain("/ai-demo");
    expect(PUBLIC_PATHS_EXCLUDED_FROM_SITEMAP).toContain("/copilot");
  });
});
