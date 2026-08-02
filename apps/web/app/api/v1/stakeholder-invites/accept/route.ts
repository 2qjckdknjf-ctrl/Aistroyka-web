/**
 * POST /api/v1/stakeholder-invites/accept — no prior tenant context required.
 * Body: { token: string }
 */

import { NextResponse } from "next/server";
import { notifyProjectManagers } from "@/lib/domain/notifications/manager-notifications.repository";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { acceptStakeholderInvite } from "@/lib/domain/stakeholders/stakeholders.service";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 });

  const { data, error } = await acceptStakeholderInvite(supabase, user.id, user.email, token);
  if (!data) {
    const status =
      error.includes("not found") || error.includes("no longer") ? 404 : error.includes("expired") ? 410 : 400;
    return NextResponse.json({ error }, { status });
  }

  const admin = getAdminClient();
  if (admin) {
    await notifyProjectManagers(admin, data.tenant_id, data.project_id, {
      type: "stakeholder_invite_accepted",
      title: "Client portal invitation accepted",
      body: "A stakeholder accepted their invitation and can use the client portal for this project.",
      target_type: "project",
      target_id: data.project_id,
      project_id: data.project_id,
    });
  }

  return jsonWithCustomerFinanceGuard("POST /api/v1/stakeholder-invites/accept", {
    data: {
      ...data,
      redirect_path: `/dashboard/projects/${data.project_id}/client`,
    },
  });
}
