import { describe, expect, it } from "vitest";
import {
  isPlatformAdminHost,
  isPublicProductHost,
  resolveHostProfile,
} from "./host-policy";

describe("host-policy", () => {
  it("recognizes admin.aistroyka.ai as platform admin host", () => {
    expect(isPlatformAdminHost("admin.aistroyka.ai")).toBe(true);
    expect(resolveHostProfile("admin.aistroyka.ai")).toBe("platform_admin");
  });

  it("recognizes public product hosts", () => {
    expect(isPublicProductHost("aistroyka.ai")).toBe(true);
    expect(isPublicProductHost("www.aistroyka.ai")).toBe(true);
    expect(resolveHostProfile("aistroyka.ai")).toBe("public_product");
  });

  it("returns unknown for unrelated hosts", () => {
    expect(resolveHostProfile("evil.example.com")).toBe("unknown");
  });
});
