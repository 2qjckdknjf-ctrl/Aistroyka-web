import { describe, it, expect } from "vitest";
import { validateDocumentStatusTransition } from "./document.policy";

describe("document.policy", () => {
  it("allows draft -> uploaded", () => {
    const r = validateDocumentStatusTransition("draft", "uploaded");
    expect(r).toEqual({ ok: true });
  });

  it("allows draft -> under_review", () => {
    const r = validateDocumentStatusTransition("draft", "under_review");
    expect(r).toEqual({ ok: true });
  });

  it("allows uploaded -> under_review", () => {
    const r = validateDocumentStatusTransition("uploaded", "under_review");
    expect(r).toEqual({ ok: true });
  });

  it("rejects uploaded -> approved", () => {
    const r = validateDocumentStatusTransition("uploaded", "approved");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_status_transition");
  });

  it("allows under_review -> approved and rejected", () => {
    expect(validateDocumentStatusTransition("under_review", "approved")).toEqual({ ok: true });
    expect(validateDocumentStatusTransition("under_review", "rejected")).toEqual({ ok: true });
  });

  it("allows approved/rejected -> archived", () => {
    expect(validateDocumentStatusTransition("approved", "archived")).toEqual({ ok: true });
    expect(validateDocumentStatusTransition("rejected", "archived")).toEqual({ ok: true });
  });

  it("allows draft -> archived", () => {
    expect(validateDocumentStatusTransition("draft", "archived")).toEqual({ ok: true });
  });

  it("rejects archived -> anything else (status)", () => {
    const r = validateDocumentStatusTransition("archived", "draft");
    expect(r.ok).toBe(false);
  });
});

