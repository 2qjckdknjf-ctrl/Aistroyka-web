import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExportSink, SinkResult } from "./sink.interface";

/** BigQuery sink stub. Implement when GCP credentials and dataset are configured. */
export const bigQuerySinkStub: ExportSink = {
  name: "bigquery",
  async write(_supabase, _batchId, rows): Promise<SinkResult> {
    if (!process.env.BIGQUERY_DATASET?.trim()) {
      return { ok: false, error: "BigQuery sink not configured (BIGQUERY_DATASET)" };
    }
    return { ok: false, error: "BigQuery sink not implemented (stub)" };
  },
};
