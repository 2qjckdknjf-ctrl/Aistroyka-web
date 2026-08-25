export interface ProjectMilestoneRow {
  id: string;
  project_id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchProjectMilestones(projectId: string): Promise<ProjectMilestoneRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function createProjectMilestone(
  projectId: string,
  body: { title: string; target_date: string },
): Promise<ProjectMilestoneRow> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      title: body.title.trim(),
      target_date: body.target_date.slice(0, 10),
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "CREATE_FAILED");
  }
  const json = await res.json();
  return json.data;
}
