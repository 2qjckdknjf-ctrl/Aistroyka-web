import { describe, expect, it } from "vitest";
import { decodeMessageCursor, encodeMessageCursor } from "./task-messages.repository";

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
