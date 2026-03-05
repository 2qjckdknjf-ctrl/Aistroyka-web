import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  finalizeUploadSession,
  expectedObjectPathPrefix,
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

    describe("MEDIA_FINALIZE_VERIFY_OBJECT", () => {
      const supabaseWithStorage = (exists: boolean, error?: string) => ({
        storage: {
          from: () => ({
            exists: () => Promise.resolve({ data: exists, error: error ? { message: error } : null }),
          }),
        },
      });

      beforeEach(() => {
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "");
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_STRICT", "");
        vi.mocked(repo.finalize).mockClear();
      });

      it("when flag off, behavior unchanged (no storage call)", async () => {
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "false");
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
        const supabase = {} as any;
        const { ok } = await finalizeUploadSession(supabase, ctx, "s1", {
          object_path: "media/t1/s1/file.jpg",
        });
        expect(ok).toBe(true);
        expect(supabase.storage).toBeUndefined();
      });

      it("when flag on and object missing, returns 400 media_object_missing", async () => {
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "true");
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
        const supabase = supabaseWithStorage(false);
        const { ok, error } = await finalizeUploadSession(supabase as any, ctx, "s1", {
          object_path: "media/t1/s1/file.jpg",
        });
        expect(ok).toBe(false);
        expect(error).toBe("media_object_missing");
        expect(repo.finalize).not.toHaveBeenCalled();
      });

      it("when flag on and object exists, finalize proceeds", async () => {
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "true");
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
        const supabase = supabaseWithStorage(true);
        const { ok } = await finalizeUploadSession(supabase as any, ctx, "s1", {
          object_path: "media/t1/s1/file.jpg",
        });
        expect(ok).toBe(true);
        expect(repo.finalize).toHaveBeenCalled();
      });

      it("when flag on, provider error and strict off: finalize proceeds", async () => {
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "true");
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_STRICT", "false");
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
        const supabase = supabaseWithStorage(false, "Network error");
        const { ok } = await finalizeUploadSession(supabase as any, ctx, "s1", {
          object_path: "media/t1/s1/file.jpg",
        });
        expect(ok).toBe(true);
        expect(repo.finalize).toHaveBeenCalled();
      });

      it("when flag on, provider error and strict on: returns error", async () => {
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_OBJECT", "true");
        vi.stubEnv("MEDIA_FINALIZE_VERIFY_STRICT", "true");
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
        const supabase = supabaseWithStorage(false, "Storage unavailable");
        const { ok, error } = await finalizeUploadSession(supabase as any, ctx, "s1", {
          object_path: "media/t1/s1/file.jpg",
        });
        expect(ok).toBe(false);
        expect(error).toBe("Storage verification unavailable");
        expect(repo.finalize).not.toHaveBeenCalled();
      });
    });
  });
});
