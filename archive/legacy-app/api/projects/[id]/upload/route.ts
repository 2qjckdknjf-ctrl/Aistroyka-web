import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "project-media";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({ project_id: projectId, status: "pending" })
    .select("id")
    .single();

  if (jobError) {
    return NextResponse.json(
      { error: jobError.message },
      { status: 500 }
    );
  }

  const { error: mediaError } = await supabase.from("media").insert({
    project_id: projectId,
    job_id: job.id,
    path,
  });

  if (mediaError) {
    return NextResponse.json(
      { error: mediaError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ jobId: job.id, path });
}
