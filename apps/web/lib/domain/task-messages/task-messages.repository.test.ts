import { describe, expect, it } from "vitest";
import {
  decodeMessageCursor,
  encodeMessageCursor,
  materializeTailPage,
} from "./task-messages.repository";

describe("task-messages.repository cursor", () => {
  it("round-trips created_at with timezone offset", () => {
    const createdAt = "2026-07-18T10:00:00+00:00";
    const id = "11111111-2222-3333-4444-555555555555";
    const cursor = encodeMessageCursor(createdAt, id);
    const decoded = decodeMessageCursor(cursor);
    expect(decoded).toEqual({ createdAt, id });
  });

  it("returns null for malformed cursor", () => {
    expect(decodeMessageCursor("not-valid")).toBeNull();
    expect(decodeMessageCursor("")).toBeNull();
  });
});

describe("materializeTailPage", () => {
  it("returns newest window in ascending display order", () => {
    // DB returns newest-first (desc); UI needs oldest→newest within the window.
    const newestFirst = [
      { id: "m100" },
      { id: "m99" },
      { id: "m98" },
      { id: "m97" }, // overflow → indicates older history exists
    ];
    const { page, hasOlder } = materializeTailPage(newestFirst, 3);
    expect(hasOlder).toBe(true);
    expect(page.map((r) => r.id)).toEqual(["m98", "m99", "m100"]);
  });

  it("keeps full short threads without claiming older pages", () => {
    const newestFirst = [{ id: "m2" }, { id: "m1" }];
    const { page, hasOlder } = materializeTailPage(newestFirst, 80);
    expect(hasOlder).toBe(false);
    expect(page.map((r) => r.id)).toEqual(["m1", "m2"]);
  });
});
