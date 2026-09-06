import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260811110000_harden_photo_annotations_comments.sql"
);

describe("photo annotations / comments RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines writer helper that excludes viewer roles", () => {
    expect(sql).toContain("is_internal_tenant_writer_for_tenant");
    expect(sql).toMatch(/tm\.role in \('owner', 'admin', 'member'\)/);
    expect(sql).not.toMatch(
      /create or replace function public\.is_internal_tenant_writer_for_tenant[\s\S]{0,800}?'viewer'/
    );
  });

  it("keeps annotation SELECT for readers and restricts writes to writers + author bind on insert", () => {
    expect(sql).toMatch(
      /photo_annotations_select_internal[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /photo_annotations_insert_internal[\s\S]{0,250}?is_internal_tenant_writer_for_tenant[\s\S]{0,120}?author_user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toMatch(
      /photo_annotations_update_internal[\s\S]{0,200}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toContain("drop policy if exists photo_annotations_internal");
    // No authenticated DELETE policy (default deny closes tenant-wide wipe).
    expect(sql).not.toMatch(
      /create policy photo_annotations_delete_internal/
    );
  });

  it("keeps comments append-only: reader select, writer insert with author bind, no update/delete", () => {
    expect(sql).toMatch(
      /photo_comments_select_internal[\s\S]{0,200}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /photo_comments_insert_internal[\s\S]{0,250}?is_internal_tenant_writer_for_tenant[\s\S]{0,120}?author_user_id = \(select auth\.uid\(\)\)/
    );
    expect(sql).toContain("drop policy if exists photo_comments_internal");
    expect(sql).not.toMatch(/create policy photo_comments_update_internal/);
    expect(sql).not.toMatch(/create policy photo_comments_delete_internal/);
  });
});
