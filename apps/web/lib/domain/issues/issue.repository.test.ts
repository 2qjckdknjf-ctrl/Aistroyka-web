import { describe, it, expect, vi } from "vitest";
import * as repo from "./issue.repository";

describe("issue.repository", () => {
  it("create returns null when title is empty", async () => {
    const supabase = {
      from: () => ({
        insert: () => ({
          select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        }),
      }),
    } as Parameters<typeof repo.create>[0];
    const result = await repo.create(supabase, "tenant-1", "user-1", {
      project_id: "proj-1",
      title: "   ",
    });
    expect(result).toBeNull();
  });

  it("create trims title and inserts", async () => {
    const inserted: Record<string, unknown> = {};
    const supabase = {
      from: (table: string) => ({
        insert: (row: Record<string, unknown>) => {
          Object.assign(inserted, row);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: "issue-1", ...row }, error: null }),
            }),
          };
        },
      }),
    } as unknown as Parameters<typeof repo.create>[0];
    const result = await repo.create(supabase, "tenant-1", "user-1", {
      project_id: "proj-1",
      title: "  Defect in wall  ",
    });
    expect(result).not.toBeNull();
    expect(inserted.title).toBe("Defect in wall");
    expect(inserted.status).toBe("open");
  });

  it("create stores evidence_upload_session_id with the new issue", async () => {
    const inserted: Record<string, unknown> = {};
    const supabase = {
      from: () => ({
        insert: (row: Record<string, unknown>) => {
          Object.assign(inserted, row);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: "issue-2", ...row }, error: null }),
            }),
          };
        },
      }),
    } as unknown as Parameters<typeof repo.create>[0];
    const result = await repo.create(supabase, "tenant-1", "user-1", {
      project_id: "proj-1",
      title: "Unsecured fence",
      evidence_upload_session_id: "  sess-issue-1  ",
    });
    expect(result).not.toBeNull();
    expect(inserted.evidence_upload_session_id).toBe("sess-issue-1");
    expect(result?.evidence_upload_session_id).toBe("sess-issue-1");
  });
});
