import { describe, expect, it } from "vitest";
import { LEGACY_API_HEADERS, setLegacyApiHeaders } from "./deprecation-headers";

describe("deprecation-headers", () => {
  it("LEGACY_API_HEADERS includes Deprecation and Sunset", () => {
    expect(LEGACY_API_HEADERS.Deprecation).toBe("true");
    expect(LEGACY_API_HEADERS.Sunset).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("setLegacyApiHeaders sets headers on provided Headers object", () => {
    const headers = new Headers();
    setLegacyApiHeaders(headers);
    expect(headers.get("Deprecation")).toBe("true");
    expect(headers.get("Sunset")).toBe(LEGACY_API_HEADERS.Sunset);
  });
});
