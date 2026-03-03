import { NextResponse } from "next/server";

/**
 * Legacy route: engine does not expose trigger_analysis(p_job_id).
 * Analysis is triggered via create_analysis_job at upload time, or via
 * POST /api/projects/[id]/media/[mediaId]/trigger for existing media.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Trigger by job_id is not supported. Use POST /api/projects/[id]/media/[mediaId]/trigger for the given media.",
    },
    { status: 501 }
  );
}
