/**
 * Static SQL + HTTP contract for Phase 2B.1 tenant-scoped analysis dequeue.
 * Does not require a live Supabase instance.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

const MIGRATION = "supabase/migrations/20260725143000_dequeue_tenant_job.sql";

describe("dequeue_tenant_job migration contract", () => {
  it("defines dequeue_tenant_job with required non-null tenant predicate", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).toMatch(/create or replace function public\.dequeue_tenant_job\s*\(/i);
    expect(sql).toMatch(/p_tenant_id\s+uuid/i);
    expect(sql).toMatch(/if p_tenant_id is null then/i);
    expect(sql).toMatch(/tenant_id\s*=\s*p_tenant_id/i);
    expect(sql).toMatch(/status\s*=\s*'queued'/i);
  });

  it("preserves atomic FOR UPDATE SKIP LOCKED dequeue", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).toMatch(/for update/i);
    expect(sql).toMatch(/skip locked/i);
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/set search_path\s*=\s*public/i);
  });

  it("restricts execute to service_role and revokes public/anon/authenticated", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).toMatch(/revoke all on function public\.dequeue_tenant_job[\s\S]*from public/i);
    expect(sql).toMatch(/revoke all on function public\.dequeue_tenant_job[\s\S]*from anon/i);
    expect(sql).toMatch(
      /revoke all on function public\.dequeue_tenant_job[\s\S]*from authenticated/i
    );
    expect(sql).toMatch(
      /grant execute on function public\.dequeue_tenant_job[\s\S]*to service_role/i
    );
  });

  it("does not drop or replace global dequeue_job", () => {
    const sql = readRelative(MIGRATION);
    expect(sql).not.toMatch(/create or replace function public\.dequeue_job\s*\(/i);
    expect(sql).not.toMatch(/drop function(?:\s+if exists)?\s+public\.dequeue_job/i);
  });
});

describe("HTTP analysis process does not call global dequeue", () => {
  it("runOneJob uses dequeue_tenant_job only", () => {
    const src = readRelative("lib/ai/runOneJob.ts");
    expect(src).toMatch(/dequeue_tenant_job/);
    expect(src).toMatch(/p_tenant_id:\s*tenantId/);
    expect(src).not.toMatch(/rpc\(\s*["']dequeue_job["']/);
  });

  it("shared HTTP handler requires tenant context and analysis:trigger", () => {
    const src = readRelative("lib/ai/analysis-process.http.ts");
    expect(src).toMatch(/getTenantContextFromRequest/);
    expect(src).toMatch(/requireTenant/);
    expect(src).toMatch(/authorize\(ctx,\s*"analysis:trigger"\)/);
    expect(src).toMatch(/processOneJob\([\s\S]*tenantId:\s*ctx\.tenantId/);
    expect(src).not.toMatch(/dequeue_job/);
  });

  it("legacy and v1 routes both use shared handler", () => {
    const legacy = readRelative("app/api/analysis/process/route.ts");
    const v1 = readRelative("app/api/v1/analysis/process/route.ts");
    expect(legacy).toMatch(/handleAnalysisProcessPost/);
    expect(v1).toMatch(/handleAnalysisProcessPost/);
    expect(legacy).toMatch(/legacy:\s*true/);
    expect(v1).toMatch(/legacy:\s*false/);
    expect(legacy).toMatch(/POST \/api\/analysis\/process/);
    expect(v1).toMatch(/POST \/api\/v1\/analysis\/process/);
  });
});
