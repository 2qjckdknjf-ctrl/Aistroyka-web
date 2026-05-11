import { describe, expect, it } from "vitest";
import { isUnsetOrPlaceholderServiceRoleKey } from "./admin";

describe("isUnsetOrPlaceholderServiceRoleKey", () => {
  it("treats empty as unset", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("")).toBe(true);
  });
  it("flags common .env example placeholders", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("PASTE_SUPABASE_SERVICE_ROLE_KEY_HERE")).toBe(true);
  });
  it("allows a non-empty key that does not look like a template", () => {
    expect(isUnsetOrPlaceholderServiceRoleKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-signature-payload")).toBe(false);
  });
});
