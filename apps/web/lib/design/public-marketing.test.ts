import { describe, expect, it } from "vitest";
import { PUBLIC_CTA_HREFS } from "@/components/public/PublicHeroCTA";

describe("public marketing CTA routes", () => {
  it("uses canonical dashboard and contact paths", () => {
    expect(PUBLIC_CTA_HREFS.launchPilot).toBe("/dashboard");
    expect(PUBLIC_CTA_HREFS.contact).toBe("/contact");
    expect(PUBLIC_CTA_HREFS.presentation).toBe("/contact");
  });
});
