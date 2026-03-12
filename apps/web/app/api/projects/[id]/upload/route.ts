import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProjectById } from "@/lib/supabase/rpc";
import { createAnalysisJob, MEDIA_BUCKET } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/auth/tenant";

function isBucketNotFoundError(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  const lower = message.toLowerCase();
  if (lower.includes("bucket") && (lower.includes("not found") || lower.includes("not exist"))) return true;
  if (lower.includes("resource") && lower.includes("not found")) return true;
  if (lower.includes("бакет") && (lower.includes("не найден") || lower.includes("not found"))) return true;
  return false;
}

const BUCKET_MANUAL_HINT =
  "Создайте бакет вручную: Supabase Dashboard → Storage → New bucket → имя: media, Public: включить. Либо добавьте в .env.local переменную SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role) — тогда бакет создастся при загрузке.";

async function ensureMediaBucket(): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, error: BUCKET_MANUAL_HINT };
  }
  const { error } = await admin.storage.createBucket(MEDIA_BUCKET, {
    public: true,
  });
  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("already exists") || msg.includes("duplicate")) return { ok: true };
    return { ok: false, error: error.message ?? "Failed to create bucket" };
  }
  return { ok: true };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: project } = await getProjectById(supabase, projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const canUpload = await hasMinRole(supabase, project.tenant_id, "member");
  if (!canUpload) {
    return NextResponse.json(
      { success: false, error: "Insufficient rights: only member and above can upload" },
      { status: 403 }
    );
  }

  const contentLength = request.headers.get("content-length");
  const maxUploadBytes = 25 * 1024 * 1024; // 25MB
  if (contentLength && parseInt(contentLength, 10) > maxUploadBytes) {
    return NextResponse.json(
      { success: false, error: "Request body too large; max 25MB" },
      { status: 413 }
    );
  }
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 }
    );
  }
  if (file.size > maxUploadBytes) {
    return NextResponse.json(
      { success: false, error: "File too large; max 25MB" },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

  // Если задан SUPABASE_SERVICE_ROLE_KEY — создаём бакет при отсутствии
  await ensureMediaBucket();

  let { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError && isBucketNotFoundError(uploadError.message)) {
    const ensureRetry = await ensureMediaBucket();
    if (ensureRetry.ok) {
      ({ error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { upsert: false }));
    } else {
      return NextResponse.json(
        { success: false, error: ensureRetry.error },
        { status: 503 }
      );
    }
  }

  if (uploadError) {
    const msg = uploadError.message ?? "Upload failed";
    const hint = isBucketNotFoundError(msg) ? ` ${BUCKET_MANUAL_HINT}` : "";
    return NextResponse.json(
      { success: false, error: msg + hint },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .insert({
      project_id: projectId,
      type: "image",
      file_url: publicUrl,
    })
    .select("id, tenant_id")
    .single();

  if (mediaError) {
    return NextResponse.json(
      { success: false, error: mediaError.message },
      { status: 500 }
    );
  }

  try {
    const job = await createAnalysisJob(supabase, {
      tenant_id: media.tenant_id,
      media_id: media.id,
      priority: "normal",
    });
    return NextResponse.json({
      success: true,
      data: { jobId: job.id, mediaId: media.id, path },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to create analysis job";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
