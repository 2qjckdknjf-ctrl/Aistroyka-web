/**
 * Smoke: authoritative request_id precedence (header > body > generated).
 */
import { describe, expect, it } from "vitest";
import { getAuthoritativeRequestId, generateRequestId } from "./client";

describe("engine client request_id", () => {
  it("uses header X-Request-Id when present", () => {
    const headers = new Headers({ "X-Request-Id": "backend-id-123" });
    const body = { request_id: "body-id" };
    const sent = "sent-id";
    expect(getAuthoritativeRequestId(headers, body, sent)).toBe("backend-id-123");
  });

  it("falls back to body.request_id when no header", () => {
    const headers = new Headers();
    const body = { request_id: "body-id" };
    const sent = "sent-id";
    expect(getAuthoritativeRequestId(headers, body, sent)).toBe("body-id");
  });

  it("falls back to sentRequestId when no header or body", () => {
    const headers = new Headers();
    const sent = "sent-id";
    expect(getAuthoritativeRequestId(headers, null, sent)).toBe("sent-id");
  });

  it("generateRequestId returns non-empty string", () => {
    const id = generateRequestId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});
