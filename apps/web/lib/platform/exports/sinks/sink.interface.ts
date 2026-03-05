/**
 * Export sink interface. Default = Supabase table; external = S3/BigQuery/Snowflake (stubs).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ExportBatchRow {
  id: string;
  tenant_id: string;
  type: string;
  sink: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface SinkResult {
  ok: boolean;
  rowsWritten?: number;
  error?: string;
}

export interface ExportSink {
  name: string;
  /** Write rows for a batch. Returns ok and rowsWritten or error. */
  write(
    supabase: SupabaseClient,
    batchId: string,
    rows: Record<string, unknown>[]
  ): Promise<SinkResult>;
}
