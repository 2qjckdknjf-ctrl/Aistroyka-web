import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExportSink, SinkResult } from "./sink.interface";

/** S3 sink stub. Implement when AWS credentials and bucket are configured. */
export const s3SinkStub: ExportSink = {
  name: "s3",
  async write(_supabase, _batchId, rows): Promise<SinkResult> {
    if (!process.env.AWS_S3_EXPORT_BUCKET?.trim()) {
      return { ok: false, error: "S3 sink not configured (AWS_S3_EXPORT_BUCKET)" };
    }
    return { ok: false, error: "S3 sink not implemented (stub)" };
  },
};
