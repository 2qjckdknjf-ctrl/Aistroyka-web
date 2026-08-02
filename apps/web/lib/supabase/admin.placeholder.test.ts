import { describe, expect, it } from "vitest";
import { isUnsetOrPlaceholderServiceRoleKey } from "./admin";

describe("isUnsetOrPlaceholderServiceRoleKey", () => {
  it("treats empty as unset", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("")).toBe(true);
  });
  it("flags common .env example placeholders", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("PASTE_SUPABASE_SERVICE_ROLE_KEY_HERE")).toBe(true);
  });
  it("allows classic JWT service_role keys", () => {
    expect(
      isUnsetOrPlaceholderServiceRoleKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.signature")
    ).toBe(false);
  });
  it("allows modern sb_secret_ keys", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("sb_secret_abc123")).toBe(false);
  });
  it("rejects opaque non-JWT non-secret strings", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("not-a-valid-service-role")).toBe(true);
  });
});
