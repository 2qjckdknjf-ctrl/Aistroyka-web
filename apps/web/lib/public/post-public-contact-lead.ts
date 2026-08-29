import { readAttributionFromBrowser } from "@/lib/public/lead-attribution";
import { trackGrowthEvent } from "@/lib/growth/track-event";

export async function postPublicContactLead(
  payload: Record<string, unknown>,
  locale: string,
): Promise<{ ok: true } | { ok: false; error?: string }> {
  const attribution = { ...readAttributionFromBrowser(), locale };
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, ...attribution }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { ok: false, error: typeof json.error === "string" ? json.error : undefined };
  }
  void trackGrowthEvent("contact_lead.submitted", {
    page: typeof window === "undefined" ? "" : window.location.pathname,
    locale,
  });
  return { ok: true };
}
