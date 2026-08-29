const UTM_MAX = 200;
const URL_MAX = 2000;

function clip(value: string | undefined, max: number): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().slice(0, max);
  if (!trimmed || /[\u0000-\u001f]/.test(trimmed)) {
    return null;
  }
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export type LeadAttribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string | null;
  referrer: string | null;
  locale: string | null;
};

export function sanitizeLeadAttribution(input: Partial<LeadAttribution> | Record<string, unknown>): LeadAttribution {
  return {
    utm_source: clip(typeof input.utm_source === "string" ? input.utm_source : undefined, UTM_MAX),
    utm_medium: clip(typeof input.utm_medium === "string" ? input.utm_medium : undefined, UTM_MAX),
    utm_campaign: clip(typeof input.utm_campaign === "string" ? input.utm_campaign : undefined, UTM_MAX),
    utm_content: clip(typeof input.utm_content === "string" ? input.utm_content : undefined, UTM_MAX),
    utm_term: clip(typeof input.utm_term === "string" ? input.utm_term : undefined, UTM_MAX),
    landing_page: clip(typeof input.landing_page === "string" ? input.landing_page : undefined, URL_MAX),
    referrer: clip(typeof input.referrer === "string" ? input.referrer : undefined, URL_MAX),
    locale: clip(typeof input.locale === "string" ? input.locale : undefined, 16),
  };
}

const STORAGE_KEY = "aistroyka_first_touch_attribution";

export function mergeFirstTouchAttribution(
  current: LeadAttribution,
  stored: LeadAttribution | null,
): LeadAttribution {
  const first = stored ?? current;
  return sanitizeLeadAttribution({
    utm_source: first.utm_source ?? current.utm_source,
    utm_medium: first.utm_medium ?? current.utm_medium,
    utm_campaign: first.utm_campaign ?? current.utm_campaign,
    utm_content: first.utm_content ?? current.utm_content,
    utm_term: first.utm_term ?? current.utm_term,
    landing_page: first.landing_page ?? current.landing_page,
    referrer: first.referrer ?? current.referrer,
    locale: current.locale ?? first.locale,
  });
}

export function readAttributionFromBrowser(): LeadAttribution {
  if (typeof window === "undefined") {
    return sanitizeLeadAttribution({});
  }
  const params = new URLSearchParams(window.location.search);
  const current = sanitizeLeadAttribution({
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
    landing_page: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || undefined,
  });
  let stored: LeadAttribution | null = null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    stored = raw ? sanitizeLeadAttribution(JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    stored = null;
  }
  const merged = mergeFirstTouchAttribution(current, stored);
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Private mode or quota: keep the in-memory merge only.
  }
  return merged;
}
