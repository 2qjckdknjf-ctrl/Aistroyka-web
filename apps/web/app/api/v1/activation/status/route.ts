import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getTenantForCurrentUser } from "@/lib/api/engine";
import { shouldShowOnboarding } from "@/lib/onboarding/user-onboarding";

/**
 * GET /api/v1/activation/status
 * Returns product activation state for onboarding and Get Started checklist.
 */
export async function GET() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = await getTenantForCurrentUser(supabase);
  if (!tenantId) {
    return NextResponse.json({
      projectCount: 0,
      hasInvited: false,
      taskCount: 0,
      reportCount: 0,
      hasAiInsight: false,
      showOnboarding: await shouldShowOnboarding(supabase, user.id),
      getStarted: { createProject: false, inviteTeam: false, addTask: false, uploadReport: false, viewAi: false },
    });
  }

  const [
    projectsListRes,
    projectsRes,
    membersRes,
    invitationsRes,
    tasksRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from("projects").select("id").eq("tenant_id", tenantId).order("created_at", { ascending: true }).limit(1),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("tenant_members").select("user_id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("tenant_invitations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("worker_tasks").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("worker_reports").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);

  const projectCount = projectsRes.count ?? 0;
  const firstProject = (projectsListRes.data ?? []) as { id: string }[];
  const firstProjectId = firstProject[0]?.id;
  const memberCount = membersRes.count ?? 0;
  const invitationCount = invitationsRes.error ? 0 : (invitationsRes.count ?? 0);
  const taskCount = tasksRes.count ?? 0;
  const reportCount = reportsRes.count ?? 0;
  const hasInvited = memberCount > 1 || invitationCount > 0;

  let hasAiInsight = false;
  if (projectCount > 0 && firstProjectId) {
    const { data: mediaRows } = await supabase
      .from("media")
      .select("id")
      .eq("project_id", firstProjectId)
      .limit(100);
    const mediaIds = (mediaRows ?? []).map((m: { id: string }) => m.id);
    if (mediaIds.length > 0) {
      const { count: analysisCount } = await supabase
        .from("analysis_jobs")
        .select("id", { count: "exact", head: true })
        .in("media_id", mediaIds);
      hasAiInsight = (analysisCount ?? 0) > 0;
    }
  }

  const showOnboarding = await shouldShowOnboarding(supabase, user.id);
  const getStarted = {
    createProject: projectCount > 0,
    inviteTeam: hasInvited,
    addTask: taskCount > 0,
    uploadReport: reportCount > 0,
    viewAi: hasAiInsight,
  };

  return NextResponse.json({
    projectCount,
    firstProjectId: firstProjectId ?? undefined,
    hasInvited,
    taskCount,
    reportCount,
    hasAiInsight,
    showOnboarding,
    getStarted,
  });
}
