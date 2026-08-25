import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listDocuments } from "@/lib/domain/documents/document.service";
import { resolveWorkerDocumentOpenUrl } from "@/lib/domain/documents/worker-document-open-url";

export const dynamic = "force-dynamic";

/** GET /api/v1/worker/documents?project_id= — drawings and instructions the worker can read. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const projectId = new URL(request.url).searchParams.get("project_id")?.trim() ?? "";
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listDocuments(supabase, ctx, projectId);
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  const tenantId = ctx.tenantId ?? "";
  const mapped = await Promise.all(
    (data ?? []).map(async (doc) => ({
      ...doc,
      open_url: tenantId
        ? await resolveWorkerDocumentOpenUrl(supabase, tenantId, doc.object_path)
        : null,
    }))
  );
  return NextResponse.json({ data: mapped });
}
