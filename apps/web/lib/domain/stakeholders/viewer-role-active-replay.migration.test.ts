import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261005110000_keep_viewer_role_on_active_stakeholder_replay.sql"),
  "utf8"
);

describe("viewer role on active stakeholder replay", () => {
  it("allows viewer → stakeholder only for an unexpired invited grant", () => {
    const viewerBranch = sql.slice(sql.indexOf("old.role = 'viewer'"));
    expect(viewerBranch).toMatch(/ps\.status = 'invited'/);
    expect(viewerBranch).toMatch(/ps\.expires_at > now\(\)/);
    expect(viewerBranch).not.toMatch(/ps\.status = 'active'/);
  });
});
