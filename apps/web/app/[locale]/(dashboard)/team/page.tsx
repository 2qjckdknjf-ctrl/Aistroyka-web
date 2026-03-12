import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/auth/tenant";
import { TeamPageClient } from "./TeamPageClient";
import { Card, Alert } from "@/components/ui";

export default async function TeamPage() {
  const t = await getTranslations("team");
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) redirect("/dashboard");

  const canManage = await hasMinRole(supabase, tenantId, "admin");

  let members: { user_id: string; role: string; created_at: string; is_owner: boolean }[] = [];
  let invitations: { id: string; email: string; role: string; expires_at: string }[] = [];
  let teamFeaturesAvailable = true;

  if (canManage) {
    try {
      const { error: probeError } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .limit(1);
      if (probeError) {
        teamFeaturesAvailable = false;
      } else {
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("user_id")
          .eq("id", tenantId)
          .single();
        const { data: memberRows } = await supabase
          .from("tenant_members")
          .select("user_id, role, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: true });
        members = (memberRows ?? []).map((r) => ({
          user_id: r.user_id,
          role: r.role,
          created_at: r.created_at,
          is_owner: tenantRow?.user_id === r.user_id,
        }));
        const { data: invRows } = await supabase
          .from("tenant_invitations")
          .select("id, email, role, expires_at")
          .eq("tenant_id", tenantId)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });
        invitations = invRows ?? [];
      }
    } catch {
      teamFeaturesAvailable = false;
    }
  } else {
    const { error: probeError } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .limit(1);
    if (probeError) teamFeaturesAvailable = false;
  }

  return (
    <>
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">{t("title")}</h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("subtitle")}</p>
      </Card>
      {!teamFeaturesAvailable && (
        <div className="mb-aistroyka-6">
          <Alert style="warning" message={`${t("migrationRequiredTitle")} ${t("migrationRequiredSteps")} ${t("migrationFileHint")}`} />
        </div>
      )}
      <TeamPageClient
        members={members}
        invitations={invitations}
        canManage={canManage}
        currentUserId={user.id}
        teamFeaturesAvailable={teamFeaturesAvailable}
      />
    </>
  );
}
