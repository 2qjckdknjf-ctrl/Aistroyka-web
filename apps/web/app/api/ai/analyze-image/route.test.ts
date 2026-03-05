import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function jsonRequest(body: object) {
  return new Request("http://test/api/ai/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/analyze-image", () => {
  it("returns 503 when no vision provider is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const req = jsonRequest({ image_url: "https://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("No AI vision provider is configured");
  });

  it("returns 400 for invalid JSON body", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = new Request("http://test/api/ai/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("JSON");
  });

  it("returns 400 when image_url is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("image_url");
  });

  it("returns 400 when image_url is empty string", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({ image_url: "   " });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("image_url");
  });

  it("returns 400 for invalid URL", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({ image_url: "not-a-url" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/valid URL|URL/);
  });

  it("returns 400 for non-http(s) URL", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = jsonRequest({ image_url: "file:///etc/passwd" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/http|https/);
  });

  it("returns 400 when image_url exceeds max length", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const longUrl = "https://example.com/" + "a".repeat(2048);
    const req = jsonRequest({ image_url: longUrl });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/too long|long/);
  });

  it("returns 413 when content-length exceeds limit", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const req = new Request("http://test/api/ai/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "200000",
      },
      body: JSON.stringify({ image_url: "https://example.com/photo.jpg" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain("too large");
  });

  it("returns 400 for http URL in production", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("NODE_ENV", "production");
    const req = jsonRequest({ image_url: "http://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/https|production/);
  });

  it("includes Deprecation and Sunset headers (legacy route)", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const req = jsonRequest({ image_url: "https://example.com/photo.jpg" });
    const res = await POST(req);
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Sunset")).toBeDefined();
  });
});
