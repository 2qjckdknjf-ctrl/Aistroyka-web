import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  finalizeUploadSession,
  expectedObjectPathPrefix,
  verifyStorageObject,
  UPLOAD_BUCKET,
} from "./upload-session.service";
import * as repo from "./upload-session.repository";

vi.mock("./upload-session.repository");
vi.mock("@/lib/sync/change-log.repository", () => ({ emitChange: vi.fn().mockResolvedValue(undefined) }));

const ctx = {
  tenantId: "t1",
  userId: "u1",
  role: "member" as const,
  subscriptionTier: "free",
  clientProfile: "web" as const,
  traceId: "trace1",
};

describe("upload-session.service", () => {
  describe("expectedObjectPathPrefix", () => {
    it("returns tenant-scoped path", () => {
      expect(expectedObjectPathPrefix("t1", "sess1")).toBe(`${UPLOAD_BUCKET}/t1/sess1`);
    });
  });

  describe("finalizeUploadSession", () => {
    it("rejects object_path outside session path", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      const { ok, error } = await finalizeUploadSession(
        {} as any,
        ctx,
        "s1",
        { object_path: "other/tenant/path" }
      );
      expect(ok).toBe(false);
      expect(error).toBe("object_path must be within session path");
      expect(repo.finalize).not.toHaveBeenCalled();
    });

    it("rejects object_path with path traversal", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      const { ok } = await finalizeUploadSession(
        {} as any,
        ctx,
        "s1",
        { object_path: "media/t1/s1/../other" }
      );
      expect(ok).toBe(false);
    });

    it("accepts object_path matching session prefix and calls repo.finalize", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      vi.mocked(repo.finalize).mockResolvedValue(true);
      const { ok, error } = await finalizeUploadSession(
        {} as any,
        ctx,
        "s1",
        { object_path: "media/t1/s1/file.jpg" }
      );
      expect(ok).toBe(true);
      expect(error).toBe("");
      expect(repo.finalize).toHaveBeenCalledWith(
        expect.anything(),
        "s1",
        "t1",
        "u1",
        { object_path: "media/t1/s1/file.jpg" }
      );
    });

    it("accepts object_path exactly equal to prefix", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      vi.mocked(repo.finalize).mockResolvedValue(true);
      const { ok } = await finalizeUploadSession(
        {} as any,
        ctx,
        "s1",
        { object_path: "media/t1/s1" }
      );
      expect(ok).toBe(true);
    });
  });

  describe("finalize with MEDIA_FINALIZE_VERIFY_OBJECT", () => {
    beforeEach(() => {
      vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "true");
      vi.stubEnv("MEDIA_FINALIZE_VERIFY_STRICT", "false");
    });
    afterEach(() => {
      vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "");
      vi.stubEnv("MEDIA_FINALIZE_VERIFY_STRICT", "");
      vi.unstubAllEnvs();
    });

    it("when flag off (stub false), behavior unchanged and does not call storage", async () => {
      vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "");
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      vi.mocked(repo.finalize).mockResolvedValue(true);
      const supabase = { storage: { from: vi.fn() } } as any;
      const { ok } = await finalizeUploadSession(supabase, ctx, "s1", {
        object_path: "media/t1/s1/file.jpg",
      });
      expect(ok).toBe(true);
      expect(supabase.storage.from).not.toHaveBeenCalled();
    });

    it("when flag on and object missing, returns code media_object_missing", async () => {
      vi.mocked(repo.finalize).mockClear();
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      const supabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            list: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        },
      } as any;
      const result = await finalizeUploadSession(supabase, ctx, "s1", {
        object_path: "media/t1/s1/file.jpg",
      });
      expect(result.ok).toBe(false);
      expect((result as { code?: string }).code).toBe("media_object_missing");
      expect(repo.finalize).not.toHaveBeenCalled();
    });

    it("when flag on and verifyError and strict off, finalize proceeds", async () => {
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      vi.mocked(repo.finalize).mockResolvedValue(true);
      const supabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            list: vi.fn().mockResolvedValue({ data: null, error: { message: "Network error" } }),
          }),
        },
      } as any;
      const result = await finalizeUploadSession(supabase, ctx, "s1", {
        object_path: "media/t1/s1/file.jpg",
      });
      expect(result.ok).toBe(true);
      expect(repo.finalize).toHaveBeenCalled();
    });

    it("when flag on and verifyError and strict on, returns code storage_unavailable", async () => {
      vi.stubEnv("MEDIA_FINALIZE_VERIFY_STRICT", "true");
      vi.mocked(repo.finalize).mockClear();
      vi.mocked(repo.getById).mockResolvedValue({
        id: "s1",
        tenant_id: "t1",
        user_id: "u1",
        purpose: "project_media",
        status: "created",
        object_path: null,
        mime_type: null,
        size_bytes: null,
        created_at: "",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });
      const supabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            list: vi.fn().mockResolvedValue({ data: null, error: { message: "Timeout" } }),
          }),
        },
      } as any;
      const result = await finalizeUploadSession(supabase, ctx, "s1", {
        object_path: "media/t1/s1/file.jpg",
      });
      expect(result.ok).toBe(false);
      expect((result as { code?: string }).code).toBe("storage_unavailable");
      expect(repo.finalize).not.toHaveBeenCalled();
    });
  });
});

describe("verifyStorageObject", () => {
  it("returns exists true when list contains matching name", async () => {
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({
            data: [{ name: "file.jpg" }, { name: "other.png" }],
            error: null,
          }),
        }),
      },
    } as any;
    const r = await verifyStorageObject(supabase, "media", "media/t1/s1/file.jpg");
    expect(r.exists).toBe(true);
    expect(r.verifyError).toBeUndefined();
  });

  it("returns exists false when list does not contain name", async () => {
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: [{ name: "other.png" }], error: null }),
        }),
      },
    } as any;
    const r = await verifyStorageObject(supabase, "media", "media/t1/s1/file.jpg");
    expect(r.exists).toBe(false);
  });

  it("returns verifyError when list returns error", async () => {
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: null, error: { message: "Forbidden" } }),
        }),
      },
    } as any;
    const r = await verifyStorageObject(supabase, "media", "media/t1/s1/file.jpg");
    expect(r.exists).toBe(false);
    expect(r.verifyError).toBe("Forbidden");
  });
});
