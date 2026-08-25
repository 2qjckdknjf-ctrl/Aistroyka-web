import { getPublicConfig } from "@/lib/config/public";

export const PROJECT_DOCUMENTS_MEDIA_BUCKET = "media";
export const PROJECT_DOCUMENTS_MAX_UPLOAD_MB = 25;

export interface ProjectDocumentRow {
  id: string;
  tenant_id: string;
  project_id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  object_path?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
  decision_comment?: string | null;
  decided_by?: string | null;
  created_at: string;
  updated_at: string;
}

export function projectDocumentFileUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  const base = (getPublicConfig().NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${PROJECT_DOCUMENTS_MEDIA_BUCKET}/${objectPath}`;
}

export function fileNameFromObjectPath(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  const parts = objectPath.split("/");
  const fileName = parts[parts.length - 1];
  return fileName || objectPath;
}

export async function fetchProjectDocuments(projectId: string): Promise<ProjectDocumentRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function createProjectDocument(
  projectId: string,
  body: {
    type: string;
    title: string;
    description?: string;
    report_id?: string;
    task_id?: string;
    milestone_id?: string;
  },
): Promise<ProjectDocumentRow> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "CREATE_FAILED");
  }
  const json = await res.json();
  return json.data;
}

export async function uploadProjectDocumentFile(
  projectId: string,
  documentId: string,
  file: File,
): Promise<ProjectDocumentRow> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "UPLOAD_FAILED");
  }
  const json = await res.json();
  const payload = json.data as ProjectDocumentRow | { document?: ProjectDocumentRow };
  if (payload && typeof payload === "object" && "document" in payload && payload.document) {
    return payload.document;
  }
  return payload as ProjectDocumentRow;
}

export async function updateProjectDocument(
  projectId: string,
  documentId: string,
  body: {
    status?: string;
    report_id?: string;
    task_id?: string;
    milestone_id?: string;
    decision_comment?: string;
  },
): Promise<ProjectDocumentRow> {
  const res = await fetch(`/api/v1/projects/${projectId}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "UPDATE_FAILED");
  }
  const json = await res.json();
  return json.data;
}
