import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";

/**
 * GET /api/activation/status
 * Returns product activation state for onboarding and Get Started checklist.
 */
export async function GET() {
  const supabase = await createClient();
  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) {
    return NextResponse.json({
      projectCount: 0,
      hasInvited: false,
      taskCount: 0,
      reportCount: 0,
      hasAiInsight: false,
      showOnboarding: true,
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
  const invitationCount = invitationsRes.count ?? 0;
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

  const showOnboarding = projectCount === 0;
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
