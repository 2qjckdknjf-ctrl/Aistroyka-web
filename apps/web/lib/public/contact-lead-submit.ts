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
  // contact_leads is not in the generated Database types; the typed insert
  // resolves to never[], and the error line shifts between supabase-js patch
  // versions, so a cast is more stable here than @ts-expect-error.
  const row = {
    name: data.name,
    email: data.email,
    company: data.company ?? null,
    message: data.message,
    source: "contact_form",
    status: "new",
  };
  return admin.from("contact_leads").insert(row as never);
}
