const ANON_KEY = "aistroyka_growth_anon";
const SESSION_KEY = "aistroyka_growth_session";
const VIEW_ID_PREFIX = "aistroyka_growth_evt:";

const VIEW_EVENTS = new Set([
  "landing_page.viewed",
  "solution.viewed",
  "pricing.viewed",
  "contact_lead.started",
]);

function storageGet(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function sessionGet(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    return;
  }
}

function anonymousId(): string {
  const existing = storageGet(ANON_KEY);
  if (existing) {
    return existing;
  }
  const created = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `anon-${Date.now()}`;
  storageSet(ANON_KEY, created);
  return created;
}

function sessionId(): string {
  const existing = sessionGet(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const created = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ses-${Date.now()}`;
  sessionSet(SESSION_KEY, created);
  return created;
}

function eventIdFor(name: string, properties: Record<string, string | number | boolean>): string {
  const page = String(properties.page ?? "");
  if (VIEW_EVENTS.has(name)) {
    const key = `${VIEW_ID_PREFIX}${name}:${page}`;
    const existing = sessionGet(key);
    if (existing) {
      return existing;
    }
    const created = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${name}-${Date.now()}`;
    sessionSet(key, created);
    return created;
  }
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${name}-${Date.now()}`;
}

export function sanitizeGrowthProperties(
  properties: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const allowed = new Set([
    "page",
    "placement",
    "locale",
    "campaign",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "referrer",
    "path",
  ]);
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!allowed.has(key)) {
      continue;
    }
    if (typeof value === "string") {
      const clipped = value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 200);
      if (!clipped || clipped.includes("@")) {
        continue;
      }
      clean[key] = clipped;
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export async function trackGrowthEvent(
  name: string,
  properties: Record<string, string | number | boolean>,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_GROWTH_OS_EVENTS_URL;
  if (!url || typeof window === "undefined") {
    return;
  }
  const payload = {
    productSlug: "aistroyka",
    surface: "website",
    environment: "production",
    anonymousId: anonymousId(),
    session_id: sessionId(),
    event_id: eventIdFor(name, properties),
    event_version: 1,
    name,
    occurredAt: new Date().toISOString(),
    properties: sanitizeGrowthProperties(properties),
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Beacon failures must not break marketing pages.
  }
}
