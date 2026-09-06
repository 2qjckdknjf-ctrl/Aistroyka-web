import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateIssueEvidenceSession } from "./issue-evidence";
import { getById as getUploadSessionById } from "@/lib/domain/upload-session/upload-session.repository";

vi.mock("@/lib/domain/upload-session/upload-session.repository", () => ({
  getById: vi.fn(),
}));

const ctx = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member" as const,
  subscriptionTier: "free",
  clientProfile: "ios_worker" as const,
  traceId: "trace-1",
};

function session(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sess-1",
    tenant_id: "tenant-1",
    user_id: "worker-1",
    purpose: "issue_evidence",
    status: "finalized",
    object_path: "tenant-1/worker-1/sess-1.jpg",
    mime_type: "image/jpeg",
    size_bytes: 100,
    created_at: "2026-09-06T00:00:00.000Z",
    expires_at: "2026-09-06T01:00:00.000Z",
    ...overrides,
  } as never;
}

describe("validateIssueEvidenceSession", () => {
  beforeEach(() => {
    vi.mocked(getUploadSessionById).mockReset();
  });

  it("accepts a finalized issue_evidence session owned by the current user", async () => {
    vi.mocked(getUploadSessionById).mockResolvedValue(session());
    await expect(validateIssueEvidenceSession({} as never, ctx, "sess-1")).resolves.toEqual({ ok: true });
  });

  it("rejects a session owned by another user", async () => {
    vi.mocked(getUploadSessionById).mockResolvedValue(session({ user_id: "worker-2" }));
    const result = await validateIssueEvidenceSession({} as never, ctx, "sess-1");
    expect(result).toEqual({ ok: false, error: "Evidence session not owned by user", status: 403 });
  });

  it("rejects the wrong upload purpose", async () => {
    vi.mocked(getUploadSessionById).mockResolvedValue(session({ purpose: "report_after" }));
    const result = await validateIssueEvidenceSession({} as never, ctx, "sess-1");
    expect(result).toEqual({ ok: false, error: "Invalid evidence purpose", status: 400 });
  });

  it("rejects non-finalized evidence", async () => {
    vi.mocked(getUploadSessionById).mockResolvedValue(session({ status: "uploaded" }));
    const result = await validateIssueEvidenceSession({} as never, ctx, "sess-1");
    expect(result).toEqual({ ok: false, error: "Evidence session not finalized", status: 400 });
  });
});
