import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  __dirname,
  "../../supabase/migrations/20260906115000_harden_photo_annotations_comments.sql"
);

describe("photo collaboration RLS hardening", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("keeps photo collaboration readable while excluding viewers from writes", () => {
    expect(sql).toMatch(
      /photo_annotations_select_internal[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /photo_annotations_insert_internal[\s\S]{0,350}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /photo_annotations_update_internal[\s\S]{0,350}?is_internal_tenant_writer_for_tenant/
    );
    expect(sql).toMatch(
      /photo_comments_select_internal[\s\S]{0,250}?is_internal_tenant_reader_for_tenant/
    );
    expect(sql).toMatch(
      /photo_comments_insert_internal[\s\S]{0,350}?is_internal_tenant_writer_for_tenant/
    );
  });

  it("binds inserts to caller identity and the same-tenant media row", () => {
    expect(sql).toContain("media_belongs_to_tenant");
    expect(sql).toMatch(
      /photo_annotations_insert_internal[\s\S]{0,450}?author_user_id = \(select auth\.uid\(\)\)[\s\S]{0,250}?media_belongs_to_tenant\(media_id, tenant_id\)/
    );
    expect(sql).toMatch(
      /photo_comments_insert_internal[\s\S]{0,450}?author_user_id = \(select auth\.uid\(\)\)[\s\S]{0,250}?media_belongs_to_tenant\(media_id, tenant_id\)/
    );
  });

  it("prevents moving or re-attributing annotations through direct REST updates", () => {
    expect(sql).toContain("enforce_photo_annotation_identity_immutable");
    expect(sql).toContain("new.tenant_id is distinct from old.tenant_id");
    expect(sql).toContain("new.media_id is distinct from old.media_id");
    expect(sql).toContain("new.author_user_id is distinct from old.author_user_id");
    expect(sql).toContain("new.created_at is distinct from old.created_at");
    expect(sql).toContain("photo annotation identity fields are immutable");
  });

  it("keeps comments append-only and removes authenticated delete paths", () => {
    expect(sql).toContain("drop policy if exists photo_annotations_delete_internal");
    expect(sql).toContain("drop policy if exists photo_comments_update_internal");
    expect(sql).toContain("drop policy if exists photo_comments_delete_internal");
    expect(sql).not.toMatch(/create policy photo_annotations_delete_internal/);
    expect(sql).not.toMatch(/create policy photo_comments_update_internal/);
    expect(sql).not.toMatch(/create policy photo_comments_delete_internal/);
  });
});
