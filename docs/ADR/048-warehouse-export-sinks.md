# ADR-048: Data warehouse export pipeline and sinks

**Status:** Accepted  
**Decision:** Tables export_batches (tenant_id, type, sink, status, started_at, finished_at) and export_rows (batch_id, seq, payload). Sink interface: write(supabase, batchId, rows) → SinkResult. Default sink supabase_table (writes to export_rows). Stubs: s3, bigquery, snowflake (return not configured / not implemented until credentials exist). Docs: DATA-WAREHOUSE-EXPORTS.md. Export job types can include events, ai_usage, audit_logs, productivity.

**Context:** Phase 6.2; analytics at scale for BigQuery/Snowflake later.

**Consequences:** Current exports continue to work; new batches can target different sinks when implemented.
