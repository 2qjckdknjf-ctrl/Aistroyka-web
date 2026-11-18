import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS = resolve(__dirname, "../../supabase/migrations");
const bootstrapName = "20260906109500_bootstrap_worker_day_project_id.sql";
const consistencyName = "20260906110000_project_ops_tenant_consistency.sql";
const historicalName = "20260407120000_worker_day_project_id.sql";

const bootstrap = readFileSync(resolve(MIGRATIONS, bootstrapName), "utf8").toLowerCase();
const consistency = readFileSync(resolve(MIGRATIONS, consistencyName), "utf8").toLowerCase();
const historical = readFileSync(resolve(MIGRATIONS, historicalName), "utf8").toLowerCase();

describe("worker_day project schema compatibility hardening", () => {
  it("orders the live-schema bootstrap before project consistency hardening", () => {
    expect(bootstrapName < consistencyName).toBe(true);
  });

  it("recreates only the idempotent historical worker_day project schema delta", () => {
    expect(historical).toContain("add column if not exists project_id uuid references public.projects(id)");
    expect(bootstrap).toContain("alter table public.worker_day");
    expect(bootstrap).toContain("add column if not exists project_id uuid references public.projects(id)");
    expect(bootstrap).toContain("create index if not exists idx_worker_day_tenant_project");
    expect(bootstrap).not.toContain("create policy");
    expect(bootstrap).not.toContain("drop policy");
  });

  it("proves the later hardening really depends on worker_day.project_id", () => {
    expect(consistency).toContain("worker_day_write_internal_insert");
    expect(consistency).toContain("worker_day_write_internal_update");
    expect(consistency).toMatch(/worker_day[\s\S]*project_id is null[\s\S]*project_belongs_to_tenant\(project_id, tenant_id\)/);
  });
});
