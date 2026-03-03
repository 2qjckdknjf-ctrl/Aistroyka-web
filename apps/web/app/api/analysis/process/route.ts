import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processOneJob } from "@/lib/ai/runOneJob";

/**
 * Process one analysis job (dequeue → AI → complete).
 * Call this after upload or from polling so the web app can run the engine without a separate worker.
 * Requires AI_ANALYSIS_URL in env. Authenticated user required.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const aiUrl = process.env.AI_ANALYSIS_URL?.trim();

  const result = await processOneJob(supabase, aiUrl);

  if (!result.ok) {
    if (result.reason === "no_url") {
      return NextResponse.json(
        { ok: false, error: "AI_ANALYSIS_URL is not configured" },
        { status: 503 }
      );
    }
    if (result.reason === "no_job") {
      return NextResponse.json({ ok: true, processed: false });
    }
    return NextResponse.json(
      { ok: false, error: result.message ?? "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    processed: true,
    jobId: result.jobId,
    status: result.status,
  });
}
