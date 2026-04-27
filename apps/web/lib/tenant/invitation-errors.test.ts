import { describe, expect, it } from "vitest";
import { mapInvitationDbError } from "./invitation-errors";

describe("mapInvitationDbError", () => {
  it("maps schema cache missing table to 503", () => {
    const r = mapInvitationDbError({
      message: "Could not find the table 'public.tenant_invitations' in the schema cache",
    });
    expect(r?.status).toBe(503);
    expect(r?.message).toContain("migrations");
  });

  it("maps Postgres undefined_table to 503", () => {
    const r = mapInvitationDbError({ code: "42P01", message: "relation does not exist" });
    expect(r?.status).toBe(503);
  });

  it("returns null for unrelated errors", () => {
    expect(mapInvitationDbError({ message: "connection refused" })).toBeNull();
  });
});
