import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { attachEvidenceUrls } from "./issue.repository";
import type { ProjectIssue } from "./issue.types";

vi.mock("@/lib/config", () => ({
  getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }),
}));

function issue(partial: Partial<ProjectIssue>): ProjectIssue {
  return {
    id: "i1",
    project_id: "proj-1",
    tenant_id: "t1",
    title: "Fence",
    description: null,
    status: "open",
    task_id: null,
    milestone_id: null,
    created_by: null,
    resolved_at: null,
    resolved_by: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

function supabaseWithSessions(rows: unknown[]): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        in: async () => ({ data: rows, error: null }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("attachEvidenceUrls", () => {
  it("leaves issues without a session as evidence_url null", async () => {
    const data = await attachEvidenceUrls(supabaseWithSessions([]), [issue({})]);
    expect(data[0]?.evidence_url).toBeNull();
  });

  it("maps a finalized session path to a public media URL", async () => {
    const data = await attachEvidenceUrls(
      supabaseWithSessions([
        { id: "sess-1", object_path: "media/t1/sess-1/photo.jpg", status: "finalized" },
      ]),
      [issue({ evidence_upload_session_id: "sess-1" })]
    );
    expect(data[0]?.evidence_url).toBe(
      "https://example.supabase.co/storage/v1/object/public/media/t1/sess-1/photo.jpg"
    );
  });

  it("skips sessions that are not finalized", async () => {
    const data = await attachEvidenceUrls(
      supabaseWithSessions([{ id: "sess-1", object_path: "media/t1/sess-1/photo.jpg", status: "uploaded" }]),
      [issue({ evidence_upload_session_id: "sess-1" })]
    );
    expect(data[0]?.evidence_url).toBeNull();
  });
});
