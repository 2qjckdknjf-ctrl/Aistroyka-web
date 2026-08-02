import { describe, expect, it } from "vitest";
import {
  assertOwnerHttpMethodForRole,
  isOwnerReadonlyAllowedMutation,
  OWNER_READONLY_ALLOWED_POST_PATH,
  ownerRoleCanCritical,
  ownerRoleCanRead,
  ownerRoleCanWrite,
  parsePlatformOwnerRole,
} from "./owner-capabilities";

describe("owner-capabilities", () => {
  it("parses known roles", () => {
    expect(parsePlatformOwnerRole("OWNER")).toBe("OWNER");
    expect(parsePlatformOwnerRole("OWNER_READONLY")).toBe("OWNER_READONLY");
    expect(parsePlatformOwnerRole("OWNER_OPERATOR")).toBe("OWNER_OPERATOR");
    expect(parsePlatformOwnerRole("bogus")).toBeNull();
    expect(parsePlatformOwnerRole("")).toBeNull();
    expect(parsePlatformOwnerRole(null)).toBeNull();
  });

  it("read capability: all platform owner roles may read", () => {
    expect(ownerRoleCanRead("OWNER_READONLY")).toBe(true);
    expect(ownerRoleCanRead("OWNER_OPERATOR")).toBe(true);
    expect(ownerRoleCanRead("OWNER")).toBe(true);
  });

  it("write vs critical capability matrix", () => {
    expect(ownerRoleCanWrite("OWNER_READONLY")).toBe(false);
    expect(ownerRoleCanWrite("OWNER_OPERATOR")).toBe(true);
    expect(ownerRoleCanWrite("OWNER")).toBe(true);
    expect(ownerRoleCanCritical("OWNER_READONLY")).toBe(false);
    expect(ownerRoleCanCritical("OWNER_OPERATOR")).toBe(false);
    expect(ownerRoleCanCritical("OWNER")).toBe(true);
  });

  it("http method gate: OWNER_READONLY blocked on ordinary mutations", () => {
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "GET")).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "HEAD")).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "OPTIONS")).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "POST")).toBe("readonly_blocked");
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "PATCH")).toBe("readonly_blocked");
    expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "DELETE")).toBe("readonly_blocked");
    expect(
      assertOwnerHttpMethodForRole(
        "OWNER_READONLY",
        "POST",
        "/api/v1/platform/testing/safe-audit/save"
      )
    ).toBe("readonly_blocked");
    expect(
      assertOwnerHttpMethodForRole(
        "OWNER_READONLY",
        "POST",
        "/api/v1/platform/billing/reprocess-event"
      )
    ).toBe("readonly_blocked");
  });

  it("http method gate: OWNER and OWNER_OPERATOR may mutate", () => {
    expect(assertOwnerHttpMethodForRole("OWNER", "POST")).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER_OPERATOR", "DELETE")).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER_OPERATOR", "PATCH")).toBe("ok");
  });

  it("safe-audit refresh: exact POST path allowed for OWNER_READONLY only", () => {
    expect(OWNER_READONLY_ALLOWED_POST_PATH).toBe(
      "/api/v1/platform/testing/safe-audit/refresh"
    );
    expect(
      isOwnerReadonlyAllowedMutation("POST", OWNER_READONLY_ALLOWED_POST_PATH)
    ).toBe(true);
    expect(
      assertOwnerHttpMethodForRole(
        "OWNER_READONLY",
        "POST",
        OWNER_READONLY_ALLOWED_POST_PATH
      )
    ).toBe("ok");
    expect(
      assertOwnerHttpMethodForRole("OWNER_OPERATOR", "POST", OWNER_READONLY_ALLOWED_POST_PATH)
    ).toBe("ok");
    expect(assertOwnerHttpMethodForRole("OWNER", "POST", OWNER_READONLY_ALLOWED_POST_PATH)).toBe(
      "ok"
    );
  });

  it("safe-audit refresh exception is exact path — no prefix or near-match widen", () => {
    const near = [
      "/api/v1/platform/testing/safe-audit/refresh/",
      "/api/v1/platform/testing/safe-audit/refresh/extra",
      "/api/v1/platform/testing/safe-audit",
      "/api/v1/platform/testing",
      "/api/v1/platform/testing/safe-audit/save",
      "/api/v1/platform/testingish/safe-audit/refresh",
      "/api/v1/platform/testing/safe-audit-refresh",
    ];
    for (const path of near) {
      expect(isOwnerReadonlyAllowedMutation("POST", path)).toBe(false);
      expect(assertOwnerHttpMethodForRole("OWNER_READONLY", "POST", path)).toBe(
        "readonly_blocked"
      );
    }
    expect(isOwnerReadonlyAllowedMutation("PATCH", OWNER_READONLY_ALLOWED_POST_PATH)).toBe(
      false
    );
    expect(isOwnerReadonlyAllowedMutation("DELETE", OWNER_READONLY_ALLOWED_POST_PATH)).toBe(
      false
    );
    expect(isOwnerReadonlyAllowedMutation("GET", OWNER_READONLY_ALLOWED_POST_PATH)).toBe(false);
  });
});
