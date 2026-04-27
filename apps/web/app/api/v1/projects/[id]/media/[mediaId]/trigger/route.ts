import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerAnalysisForMedia } from "@/lib/supabase/rpc";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { id: projectId, mediaId } = await params;
  const supabase = await createClient();
  const result = await triggerAnalysisForMedia(supabase, projectId, mediaId);
  if ("error" in result) {
    if (result.error === "Unauthorized")
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    if (
      result.error === "Project not found" ||
      result.error === "Media not found"
    )
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }
  return NextResponse.json({
    success: true,
    data: { jobId: result.jobId },
  });
}
