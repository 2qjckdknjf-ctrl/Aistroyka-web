import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    __dirname,
    "../../supabase/migrations/20260726112100_media_storage_exclude_stakeholder.sql"
  ),
  "utf8"
);

describe("media storage stakeholder RLS", () => {
  it("limits tenant_members media access to internal roles", () => {
    expect(migration).toContain("tm.role in ('owner', 'admin', 'member', 'viewer')");
    expect(migration).not.toContain("tm.role in ('owner', 'admin', 'member', 'viewer', 'stakeholder')");
  });

  it("keeps project-prefixed access for active portal stakeholders", () => {
    expect(migration).toContain("public.is_portal_stakeholder_for_project(p.id)");
  });
});
