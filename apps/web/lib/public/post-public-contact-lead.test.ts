import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postPublicContactLead } from "./post-public-contact-lead";

function stubBrowser() {
  const mem = new Map<string, string>();
  const storage = {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
  };
  vi.stubGlobal("window", {
    localStorage: storage,
    sessionStorage: storage,
    location: { pathname: "/en", search: "" },
  });
  vi.stubGlobal("document", { referrer: "" });
  vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000002" });
}

describe("postPublicContactLead telemetry", () => {
  beforeEach(() => {
    stubBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not emit contact_lead.submitted when the form request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_GROWTH_OS_EVENTS_URL", "https://growth.example/api/v1/events");
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/contact")) {
        return Promise.resolve(new Response(JSON.stringify({ error: "invalid" }), { status: 400 }));
      }
      return Promise.resolve(new Response(null, { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await postPublicContactLead({ name: "Ada", email: "a@b.c", message: "hi" }, "en");
    expect(result.ok).toBe(false);
    const growthCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes("growth.example"));
    expect(growthCalls).toHaveLength(0);
  });

  it("emits contact_lead.submitted once after HTTP 200 and still succeeds if telemetry fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_GROWTH_OS_EVENTS_URL", "https://growth.example/api/v1/events");
    let growthCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/contact")) {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
      growthCalls += 1;
      return Promise.reject(new Error("telemetry down"));
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await postPublicContactLead({ name: "Ada", email: "a@b.c", message: "hi" }, "en");
    expect(result.ok).toBe(true);
    expect(growthCalls).toBe(1);
  });
});
