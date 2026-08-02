import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTACT_MAX_BODY_BYTES,
  PUBLIC_CONTACT_IP_LIMIT,
} from "@/lib/platform/rate-limit/public-contact-rate-limit";
import {
  RATE_LIMIT_EXCEEDED_CODE,
  RATE_LIMIT_UNAVAILABLE_CODE,
} from "@/lib/platform/rate-limit/rate-limit.service";

const mockInsert = vi.fn();
const mockRpc = vi.fn();
const mockGetAdminClient = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mockGetAdminClient(...args),
}));

import { POST } from "./route";

function trustedHeaders(ip = "203.0.113.10", extra: Record<string, string> = {}) {
  return {
    "content-type": "application/json",
    "cf-connecting-ip": ip,
    ...extra,
  };
}

function jsonReq(
  body: unknown,
  opts: { ip?: string; headers?: Record<string, string>; contentLength?: string } = {}
) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const headers: Record<string, string> = {
    ...trustedHeaders(opts.ip),
    ...(opts.headers ?? {}),
  };
  if (opts.contentLength !== undefined) {
    headers["content-length"] = opts.contentLength;
  }
  return new Request("http://x/api/v1/contact", {
    method: "POST",
    headers,
    body: raw,
  });
}

describe("POST /api/v1/contact (public abuse controls)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = "1";
    mockInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: { allowed: true, current_count: 1 }, error: null });
    mockGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert: mockInsert })),
      rpc: mockRpc,
    });
  });

  it("allows trusted normalized IPv4 and inserts once", async () => {
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" }, { ip: "203.0.113.10" })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("allows trusted normalized IPv6", async () => {
    const res = await POST(
      jsonReq(
        { name: "Jane", email: "jane@example.com", message: "Hello" },
        { ip: "2001:db8::1" }
      )
    );
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("ignores spoofed x-forwarded-for when CF IP is trusted", async () => {
    const res = await POST(
      jsonReq(
        { name: "Jane", email: "jane@example.com", message: "Hello" },
        {
          ip: "203.0.113.10",
          headers: { "x-forwarded-for": "198.51.100.1", "x-real-ip": "198.51.100.2" },
        }
      )
    );
    expect(res.status).toBe(200);
    const key = (mockRpc.mock.calls[0] as unknown[])[1] as { p_key: string };
    expect(key.p_key).toContain("203.0.113.10");
    expect(key.p_key).not.toContain("198.51.100");
  });

  it("returns 503 and does not insert when trust flag is disabled", async () => {
    delete process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" })
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe(RATE_LIMIT_UNAVAILABLE_CODE);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 503 when cf-connecting-ip is missing", async () => {
    const res = await POST(
      new Request("http://x/api/v1/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jane", email: "jane@example.com", message: "Hello" }),
      })
    );
    expect(res.status).toBe(503);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 503 when cf-connecting-ip is invalid", async () => {
    const res = await POST(
      jsonReq(
        { name: "Jane", email: "jane@example.com", message: "Hello" },
        { ip: "999.999.999.999" }
      )
    );
    expect(res.status).toBe(503);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 503 when atomic RPC rejects", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "rpc down" } });
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" })
    );
    expect(res.status).toBe(503);
    expect((await res.json() as { code: string }).code).toBe(RATE_LIMIT_UNAVAILABLE_CODE);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 503 on malformed/empty RPC response", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" })
    );
    expect(res.status).toBe(503);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when limited", async () => {
    mockRpc.mockResolvedValueOnce({
      data: { allowed: false, current_count: PUBLIC_CONTACT_IP_LIMIT + 1 },
      error: null,
    });
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" })
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect((await res.json() as { code: string }).code).toBe(RATE_LIMIT_EXCEEDED_CODE);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 413 for oversized declared Content-Length before RPC", async () => {
    const res = await POST(
      jsonReq(
        { name: "Jane", email: "jane@example.com", message: "Hello" },
        { contentLength: String(CONTACT_MAX_BODY_BYTES + 1) }
      )
    );
    expect(res.status).toBe(413);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 413 for oversized undeclared/chunked body after allow", async () => {
    const huge = "x".repeat(CONTACT_MAX_BODY_BYTES + 10);
    const res = await POST(
      new Request("http://x/api/v1/contact", {
        method: "POST",
        headers: trustedHeaders(),
        body: huge,
      })
    );
    expect(res.status).toBe(413);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON after allowed limit decision", async () => {
    const res = await POST(
      new Request("http://x/api/v1/contact", {
        method: "POST",
        headers: trustedHeaders(),
        body: "{not-json",
      })
    );
    expect(res.status).toBe(400);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid schema after allowed limit decision", async () => {
    const res = await POST(jsonReq({ email: "a@b.co", message: "Hi" }));
    expect(res.status).toBe(400);
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 500 when admin client is missing", async () => {
    mockGetAdminClient.mockReturnValueOnce(null);
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" })
    );
    expect(res.status).toBe(500);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 500 when insert fails", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "db" } });
    const res = await POST(
      jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" })
    );
    expect(res.status).toBe(500);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("rate-limit decision occurs before validation and insert", async () => {
    const order: string[] = [];
    mockRpc.mockImplementation(async () => {
      order.push("rpc");
      return { data: { allowed: true, current_count: 1 }, error: null };
    });
    mockInsert.mockImplementation(async () => {
      order.push("insert");
      return { error: null };
    });
    await POST(jsonReq({ name: "Jane", email: "jane@example.com", message: "Hello" }));
    expect(order).toEqual(["rpc", "insert"]);
  });
});

describe("contact first-party callsite contract", () => {
  it("ContactForm submits to /api/v1/contact", () => {
    const src = readFileSync(
      join(process.cwd(), "app/[locale]/(public)/contact/ContactForm.tsx"),
      "utf8"
    );
    expect(src).toMatch(/fetch\(["']\/api\/v1\/contact["']/);
    expect(src).not.toMatch(/fetch\(["']\/api\/contact["']/);
  });
});
