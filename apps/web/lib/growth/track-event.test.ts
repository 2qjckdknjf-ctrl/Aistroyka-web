import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeGrowthProperties, trackGrowthEvent } from "./track-event";

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
  vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000001" });
}

describe("trackGrowthEvent", () => {
  beforeEach(() => {
    stubBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("no-ops when the Growth OS endpoint is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_GROWTH_OS_EVENTS_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await trackGrowthEvent("landing_page.viewed", { page: "/en", locale: "en" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows transport failures so the public funnel still works", async () => {
    vi.stubEnv("NEXT_PUBLIC_GROWTH_OS_EVENTS_URL", "https://growth.example/api/v1/events");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("growth os down"))),
    );
    await expect(trackGrowthEvent("cta.clicked", { page: "/en/pricing", locale: "en" })).resolves.toBeUndefined();
  });

  it("reuses a view event_id within the same session and path", async () => {
    vi.stubEnv("NEXT_PUBLIC_GROWTH_OS_EVENTS_URL", "https://growth.example/api/v1/events");
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);
    await trackGrowthEvent("landing_page.viewed", { page: "/en", locale: "en" });
    await trackGrowthEvent("landing_page.viewed", { page: "/en", locale: "en" });
    const first = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { event_id: string };
    const second = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as { event_id: string };
    expect(first.event_id).toBe(second.event_id);
  });

  it("drops email-like strings from telemetry properties", () => {
    const clean = sanitizeGrowthProperties({
      page: "/en",
      utm_source: "google",
      path: "user@example.com",
    });
    expect(clean.path).toBeUndefined();
    expect(clean.utm_source).toBe("google");
  });
});
