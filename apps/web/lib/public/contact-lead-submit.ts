import type { getAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof getAdminClient>>;

export type ContactLeadInput = {
  name: string;
  email: string;
  company?: string;
  message: string;
};

/** Persist public contact/demo form to platform-level contact_leads (service role). */
export async function insertContactLead(admin: AdminClient, data: ContactLeadInput) {
  return admin
    .from("contact_leads")
    // @ts-expect-error contact_leads insert row not in generated Database types
    .insert({
      name: data.name,
      email: data.email,
      company: data.company ?? null,
      message: data.message,
      source: "contact_form",
      status: "new",
    });
}
