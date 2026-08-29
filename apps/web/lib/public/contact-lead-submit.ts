import type { getAdminClient } from "@/lib/supabase/admin";
import type { LeadAttribution } from "@/lib/public/lead-attribution";
import { sanitizeLeadAttribution } from "@/lib/public/lead-attribution";

type AdminClient = NonNullable<ReturnType<typeof getAdminClient>>;

export type ContactLeadInput = {
  name: string;
  email: string;
  company?: string;
  message: string;
  attribution?: Partial<LeadAttribution>;
};

const ATTRIBUTION_COLUMNS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "landing_page",
  "referrer",
  "locale",
] as const;

export function isMissingAttributionColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  if (text.includes("pgrst204")) {
    return true;
  }
  return ATTRIBUTION_COLUMNS.some(
    (column) => text.includes(column) && (text.includes("schema cache") || text.includes("does not exist") || text.includes("column")),
  );
}

/** Persist public contact/demo form to platform-level contact_leads (service role). */
export async function insertContactLead(admin: AdminClient, data: ContactLeadInput) {
  const attribution = sanitizeLeadAttribution(data.attribution ?? {});
  const baseRow = {
    name: data.name,
    email: data.email,
    company: data.company ?? null,
    message: data.message,
    source: "contact_form",
    status: "new",
  };
  const attributedRow = {
    ...baseRow,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    landing_page: attribution.landing_page,
    referrer: attribution.referrer,
    locale: attribution.locale,
  };
  const attributed = await admin.from("contact_leads").insert(attributedRow as never);
  if (!attributed.error || !isMissingAttributionColumn(attributed.error)) {
    return attributed;
  }
  return admin.from("contact_leads").insert(baseRow as never);
}
