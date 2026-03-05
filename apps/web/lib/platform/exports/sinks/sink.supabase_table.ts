import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExportSink, SinkResult } from "./sink.interface";

/**
 * Default sink: write rows to export_rows table (same Supabase).
 */
export const supabaseTableSink: ExportSink = {
  name: "supabase_table",
  async write(supabase, batchId, rows): Promise<SinkResult> {
    if (rows.length === 0) return { ok: true, rowsWritten: 0 };
    const inserts = rows.map((payload, i) => ({ batch_id: batchId, seq: i + 1, payload }));
    const { error } = await supabase.from("export_rows").insert(inserts);
    if (error) return { ok: false, error: error.message };
    return { ok: true, rowsWritten: rows.length };
  },
};
