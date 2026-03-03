"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function acknowledgeGovernanceEvent(eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_governance_events")
    .update({ is_acknowledged: true })
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/governance");
  return { ok: true };
}
