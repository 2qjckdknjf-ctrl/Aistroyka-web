import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExportSink, SinkResult } from "./sink.interface";

/** Snowflake sink stub. Implement when Snowflake credentials are configured. */
export const snowflakeSinkStub: ExportSink = {
  name: "snowflake",
  async write(_supabase, _batchId, rows): Promise<SinkResult> {
    if (!process.env.SNOWFLAKE_ACCOUNT?.trim()) {
      return { ok: false, error: "Snowflake sink not configured (SNOWFLAKE_ACCOUNT)" };
    }
    return { ok: false, error: "Snowflake sink not implemented (stub)" };
  },
};
