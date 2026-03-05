import { describe, expect, it } from "vitest";
import { classifyText } from "./pii.classifier";

describe("pii.classifier", () => {
  it("returns none when no PII", () => {
    const r = classifyText("No personal data here.");
    expect(r.pii_level).toBe("none");
    expect(r.types).toHaveLength(0);
  });

  it("detects EMAIL and returns medium", () => {
    const r = classifyText("Contact me at foo@example.com");
    expect(r.types).toContain("EMAIL");
    expect(r.pii_level).toBe("medium");
  });

  it("detects PHONE", () => {
    const r = classifyText("Call +1 234 567 8900");
    expect(r.types).toContain("PHONE");
  });
});
