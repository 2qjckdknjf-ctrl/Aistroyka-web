# Data warehouse export pipeline

## Overview

- **Export types:** events, ai_usage, audit_logs, productivity (aggregated from events/slo).
- **Sinks:** Default = Supabase (export_batches + export_rows). External = S3, BigQuery, Snowflake (stubs until credentials configured).
- **Flow:** Export job creates batch, fetches data for type + tenant + range, calls sink.write(batchId, rows), updates batch status.

## Tables

- **export_batches:** id, tenant_id, type, sink, status (pending|running|completed|failed), started_at, finished_at, created_at.
- **export_rows:** batch_id, seq, payload (jsonb). One row per exported record for Supabase sink.

## Sink interface

- `ExportSink.write(supabase, batchId, rows)` → SinkResult (ok, rowsWritten, error).
- Default sink "supabase_table" inserts into export_rows. External sinks write to their destination; when not configured, return error from stub.

## Enhancement to export jobs (Phase 3)

- Export handler already supports export_type (reports, ai_usage, audit_logs). Extend to include "events" and "productivity"; productivity = aggregated from events (report_submit, media_finalize, task_assign) per day. Use getSink(sinkName) with sink from job payload or default "supabase_table".

## BigQuery / Snowflake later

- When credentials exist: implement sink.write to stream/load to external warehouse. Keep export_batches in Supabase for audit; rows may be written only to warehouse.
