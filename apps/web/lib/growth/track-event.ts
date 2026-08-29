const ANON_KEY = "aistroyka_growth_anon";

function anonymousId(): string {
  if (typeof window === "undefined") {
    return "server";
  }
  const existing = window.localStorage.getItem(ANON_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  window.localStorage.setItem(ANON_KEY, created);
  return created;
}

export async function trackGrowthEvent(
  name: string,
  properties: Record<string, string | number | boolean>,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_GROWTH_OS_EVENTS_URL;
  if (!url || typeof window === "undefined") {
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productSlug: "aistroyka",
        anonymousId: anonymousId(),
        name,
        occurredAt: new Date().toISOString(),
        properties,
      }),
      keepalive: true,
    });
  } catch {
    // Beacon failures must not break marketing pages.
  }
}
