import { describe, expect, it } from "vitest";
import { getOrCreateTraceId, getOrCreateRequestId, addRequestIdToResponse } from "./trace";

describe("trace", () => {
  describe("getOrCreateTraceId", () => {
    it("returns x-request-id when present", () => {
      const req = new Request("https://x/", { headers: { "x-request-id": "  id-123  " } });
      expect(getOrCreateTraceId(req)).toBe("id-123");
    });

    it("returns generated id when header missing", () => {
      const req = new Request("https://x/");
      const id = getOrCreateTraceId(req);
      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
      expect(id).toMatch(/^[0-9a-f-]+$|^t-\d+$/);
    });
  });

  describe("getOrCreateRequestId", () => {
    it("returns same as getOrCreateTraceId", () => {
      const req = new Request("https://x/", { headers: { "x-request-id": "req-1" } });
      expect(getOrCreateRequestId(req)).toBe("req-1");
    });
  });

  describe("addRequestIdToResponse", () => {
    it("sets x-request-id on response", () => {
      const res = new Response();
      const out = addRequestIdToResponse(res, "rid-1");
      expect(out.headers.get("x-request-id")).toBe("rid-1");
      expect(out).toBe(res);
    });
  });
});
