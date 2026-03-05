export * from "./sink.interface";
export { supabaseTableSink } from "./sink.supabase_table";
export { s3SinkStub } from "./sink.s3_stub";
export { bigQuerySinkStub } from "./sink.bigquery_stub";
export { snowflakeSinkStub } from "./sink.snowflake_stub";

import { supabaseTableSink } from "./sink.supabase_table";
import { s3SinkStub } from "./sink.s3_stub";
import { bigQuerySinkStub } from "./sink.bigquery_stub";
import { snowflakeSinkStub } from "./sink.snowflake_stub";
import type { ExportSink } from "./sink.interface";

const sinks: Record<string, ExportSink> = {
  [supabaseTableSink.name]: supabaseTableSink,
  [s3SinkStub.name]: s3SinkStub,
  [bigQuerySinkStub.name]: bigQuerySinkStub,
  [snowflakeSinkStub.name]: snowflakeSinkStub,
};

export function getSink(name: string): ExportSink | null {
  return sinks[name] ?? null;
}
