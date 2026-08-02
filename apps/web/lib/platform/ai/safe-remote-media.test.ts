import { describe, expect, it, vi } from "vitest";
import {
  assertSafeRemoteMediaUrl,
  fetchSafeRemoteMedia,
  isBlockedIpAddress,
  SafeRemoteMediaError,
} from "./safe-remote-media";

describe("isBlockedIpAddress", () => {
  it("blocks loopback and RFC1918 and metadata", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("10.0.0.5")).toBe(true);
    expect(isBlockedIpAddress("192.168.1.1")).toBe(true);
    expect(isBlockedIpAddress("172.16.0.1")).toBe(true);
    expect(isBlockedIpAddress("169.254.169.254")).toBe(true);
    expect(isBlockedIpAddress("::1")).toBe(true);
  });

  it("allows public documentation addresses", () => {
    expect(isBlockedIpAddress("203.0.113.9")).toBe(false);
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
  });
});

describe("assertSafeRemoteMediaUrl", () => {
  it("blocks 127.0.0.1", async () => {
    await expect(assertSafeRemoteMediaUrl("http://127.0.0.1/x.png")).rejects.toMatchObject({
      code: "host_blocked",
    });
  });

  it("blocks ::1", async () => {
    await expect(assertSafeRemoteMediaUrl("http://[::1]/x.png")).rejects.toBeInstanceOf(
      SafeRemoteMediaError
    );
  });

  it("blocks RFC1918 literals", async () => {
    await expect(assertSafeRemoteMediaUrl("http://10.1.2.3/a.jpg")).rejects.toMatchObject({
      code: "host_blocked",
    });
  });

  it("blocks cloud metadata host", async () => {
    await expect(
      assertSafeRemoteMediaUrl("http://metadata.google.internal/computeMetadata/v1/")
    ).rejects.toMatchObject({ code: "host_blocked" });
  });

  it("blocks DNS resolving to private target", async () => {
    await expect(
      assertSafeRemoteMediaUrl("https://evil.example/photo.jpg", {
        resolveHostIps: async () => ["127.0.0.1"],
      })
    ).rejects.toMatchObject({ code: "ip_blocked" });
  });

  it("requires https in production mode", async () => {
    await expect(
      assertSafeRemoteMediaUrl("http://203.0.113.9/a.jpg", {
        requireHttps: true,
        resolveHostIps: async () => ["203.0.113.9"],
      })
    ).rejects.toMatchObject({ code: "https_required" });
  });

  it("allows valid controlled https host with public DNS", async () => {
    const url = await assertSafeRemoteMediaUrl("https://cdn.example.com/photo.jpg", {
      requireHttps: true,
      resolveHostIps: async () => ["203.0.113.9"],
    });
    expect(url.hostname).toBe("cdn.example.com");
  });
});

describe("fetchSafeRemoteMedia", () => {
  it("rejects oversized Content-Length early", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 200,
        headers: { "content-type": "image/png", "content-length": "99999999" },
      })
    );
    await expect(
      fetchSafeRemoteMedia("https://cdn.example.com/big.png", {
        maxBytes: 1000,
        resolveHostIps: async () => ["203.0.113.9"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: "too_large" });
  });

  it("rejects wrong MIME", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "text/html" },
      })
    );
    await expect(
      fetchSafeRemoteMedia("https://cdn.example.com/x", {
        maxBytes: 1000,
        resolveHostIps: async () => ["203.0.113.9"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: "wrong_mime" });
  });

  it("rejects cross-host redirect", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://evil.example/p.png" },
      })
    );
    await expect(
      fetchSafeRemoteMedia("https://cdn.example.com/x.png", {
        maxBytes: 1000,
        allowCrossHostRedirect: false,
        resolveHostIps: async () => ["203.0.113.9"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: "redirect_blocked" });
  });

  it("rejects redirect hop that resolves to private target", async () => {
    let resolveCount = 0;
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { location: "/inner.png" },
      })
    );
    await expect(
      fetchSafeRemoteMedia("https://cdn.example.com/x.png", {
        maxBytes: 1000,
        allowCrossHostRedirect: false,
        resolveHostIps: async () => {
          resolveCount += 1;
          return resolveCount === 1 ? ["203.0.113.9"] : ["169.254.169.254"];
        },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: "ip_blocked" });
  });

  it("rejects timeout", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("The operation was aborted due to timeout");
    });
    await expect(
      fetchSafeRemoteMedia("https://cdn.example.com/x.png", {
        maxBytes: 1000,
        timeoutMs: 10,
        resolveHostIps: async () => ["203.0.113.9"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("accepts valid controlled HTTPS image", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    const fetchImpl = vi.fn(async () =>
      new Response(bytes, {
        status: 200,
        headers: { "content-type": "image/png", "content-length": String(bytes.length) },
      })
    );
    const out = await fetchSafeRemoteMedia("https://cdn.example.com/ok.png", {
      maxBytes: 1000,
      resolveHostIps: async () => ["203.0.113.9"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(out.contentType).toBe("image/png");
    expect(out.data.length).toBe(4);
  });
});
