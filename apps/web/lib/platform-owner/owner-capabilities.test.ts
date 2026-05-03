import { describe, expect, it } from "vitest";
import {
  assertOwnerHttpMethodForRole,
  ownerRoleCanCritical,
  ownerRoleCanWrite,
  parsePlatformOwnerRole,
} from "./owner-capabilities";

describe("owner-capabilities", () => {
  it("parses known roles", () => {
    expect(parsePlatformOwnerRole("OWNER")).toBe("OWNER");
    expect(parsePlatformOwnerRole("OWNER_READONLY")).toBe("OWNER_READONLY");
    expect(parsePlatformOwnerRole("bogus")).toBeNull();
  });

  it("write vs critical", () => {
    expect(ownerRoleCanWrite("OWNER_READONLY")).toBe(false);
    expect(ownerRoleCanWrite("OWNER_OPERATOR")).toBe(true);
    expect(ownerRoleCanCritical("OWNER_OPERATOR")).toBe(false);
    expect(ownerRoleCanCritical("OWNER")).toBe(true);
  });

  it("http method gate for readonly", () => {
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "GET")).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "POST")).toBe("readonly_blocked");
  });
});
