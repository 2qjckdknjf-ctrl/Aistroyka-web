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

/** Persist public contact/demo form to platform-level contact_leads (service role). */
export async function insertContactLead(admin: AdminClient, data: ContactLeadInput) {
  const attribution = sanitizeLeadAttribution(data.attribution ?? {});
  const row = {
    name: data.name,
    email: data.email,
    company: data.company ?? null,
    message: data.message,
    source: "contact_form",
    status: "new",
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    landing_page: attribution.landing_page,
    referrer: attribution.referrer,
    locale: attribution.locale,
  };
  return admin.from("contact_leads").insert(row as never);
}
