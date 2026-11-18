import { describe, expect, it } from "vitest";
import * as repo from "./issue.repository";

describe("issue.repository evidence create", () => {
  it("stores a trimmed evidence_upload_session_id with the issue insert", async () => {
    const inserted: Record<string, unknown> = {};
    const supabase = {
      from: () => ({
        insert: (row: Record<string, unknown>) => {
          Object.assign(inserted, row);
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: "i1", ...row }, error: null }),
            }),
          };
        },
      }),
    } as unknown as Parameters<typeof repo.create>[0];

    const result = await repo.create(supabase, "t1", "u1", {
      project_id: "p1",
      title: "  Fence  ",
      evidence_upload_session_id: "  s1  ",
    });

    expect(result).not.toBeNull();
    expect(inserted.title).toBe("Fence");
    expect(inserted.evidence_upload_session_id).toBe("s1");
    expect(result?.evidence_upload_session_id).toBe("s1");
  });
});
