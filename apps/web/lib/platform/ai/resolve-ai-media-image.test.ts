import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAIMediaImage } from "./resolve-ai-media-image";
import { AI_ERROR_CODES } from "./ai-media-errors";

vi.mock("@/lib/config", () => ({
  getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }),
}));

type TableRow = Record<string, unknown> | null;

function makeSupabase(opts: {
  media?: TableRow;
  session?: TableRow;
  report?: TableRow;
  signedUrl?: string | null;
  signedError?: { message: string } | null;
  storageThrow?: boolean;
}) {
  const createSignedUrl = vi.fn(async () => {
    if (opts.storageThrow) throw new Error("network");
    if (opts.signedError) return { data: null, error: opts.signedError };
    return {
      data: opts.signedUrl === null ? null : { signedUrl: opts.signedUrl ?? "https://signed.example/x" },
      error: null,
    };
  });

  return {
    from: vi.fn((table: string) => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => {
          if (table === "media") return { data: opts.media ?? null, error: null };
          if (table === "upload_sessions") return { data: opts.session ?? null, error: null };
          if (table === "worker_reports") return { data: opts.report ?? null, error: null };
          if (table === "worker_tasks" || table === "worker_day") {
            return { data: null, error: null };
          }
          return { data: null, error: null };
        }),
      };
      return chain;
    }),
    storage: {
      from: vi.fn(() => ({ createSignedUrl })),
    },
    _createSignedUrl: createSignedUrl,
  } as any;
}

const tenantId = "11111111-1111-4111-8111-111111111111";
const otherTenant = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const mediaId = "44444444-4444-4444-8444-444444444444";
const projectId = "55555555-5555-4555-8555-555555555555";
const supabaseOrigin = "https://abc.supabase.co";

describe("resolveAIMediaImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves by media_id via trusted storage URL → signed URL", async () => {
    const supabase = makeSupabase({
      media: {
        id: mediaId,
        tenant_id: tenantId,
        project_id: projectId,
        file_url: `${supabaseOrigin}/storage/v1/object/public/media/${tenantId}/file.jpg`,
      },
      signedUrl: "https://signed.example/media",
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      mediaId,
      projectId,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imageUrl).toBe("https://signed.example/media");
      expect(result.source).toBe("media");
    }
    expect(supabase._createSignedUrl).toHaveBeenCalledWith(`${tenantId}/file.jpg`, 900);
  });

  it("resolves by upload_session_id with path prefix strip", async () => {
    const supabase = makeSupabase({
      session: {
        id: sessionId,
        tenant_id: tenantId,
        status: "finalized",
        object_path: `media/${tenantId}/${sessionId}/shot.jpg`,
      },
      signedUrl: "https://signed.example/session",
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      uploadSessionId: sessionId,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe("upload_session");
      expect(result.objectPath).toBe(`${tenantId}/${sessionId}/shot.jpg`);
    }
    expect(supabase._createSignedUrl).toHaveBeenCalledWith(
      `${tenantId}/${sessionId}/shot.jpg`,
      900
    );
  });

  it("returns AI_MEDIA_NOT_READY when upload not finalized", async () => {
    const supabase = makeSupabase({
      session: {
        id: sessionId,
        tenant_id: tenantId,
        status: "uploaded",
        object_path: null,
      },
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      uploadSessionId: sessionId,
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_NOT_READY,
      retryable: true,
    });
    expect(supabase._createSignedUrl).not.toHaveBeenCalled();
  });

  it("returns AI_MEDIA_NOT_FOUND when media missing and no session", async () => {
    const supabase = makeSupabase({ media: null });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      mediaId,
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_NOT_FOUND,
      retryable: false,
    });
  });

  it("denies media tenant mismatch", async () => {
    const supabase = makeSupabase({
      media: {
        id: mediaId,
        tenant_id: otherTenant,
        project_id: projectId,
        file_url: `${supabaseOrigin}/storage/v1/object/public/media/${otherTenant}/x.jpg`,
      },
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      mediaId,
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      retryable: false,
    });
    expect(supabase._createSignedUrl).not.toHaveBeenCalled();
  });

  it("denies media project mismatch", async () => {
    const supabase = makeSupabase({
      media: {
        id: mediaId,
        tenant_id: tenantId,
        project_id: "66666666-6666-4666-8666-666666666666",
        file_url: `${supabaseOrigin}/storage/v1/object/public/media/${tenantId}/x.jpg`,
      },
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      mediaId,
      projectId,
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
    });
    expect(supabase._createSignedUrl).not.toHaveBeenCalled();
  });

  it("returns AI_MEDIA_OBJECT_MISSING when storage object absent", async () => {
    const supabase = makeSupabase({
      session: {
        id: sessionId,
        tenant_id: tenantId,
        status: "finalized",
        object_path: `media/${tenantId}/${sessionId}/missing.jpg`,
      },
      signedError: { message: "Object not found" },
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      uploadSessionId: sessionId,
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_OBJECT_MISSING,
      retryable: false,
    });
  });

  it("falls back from pending media_id to finalized upload_session_id", async () => {
    const supabase = makeSupabase({
      media: {
        id: mediaId,
        tenant_id: tenantId,
        project_id: projectId,
        file_url: null,
      },
      session: {
        id: sessionId,
        tenant_id: tenantId,
        status: "finalized",
        object_path: `media/${tenantId}/${sessionId}/ok.jpg`,
      },
      signedUrl: "https://signed.example/fallback",
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      mediaId,
      uploadSessionId: sessionId,
      projectId,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.source).toBe("upload_session");
  });

  it("rejects arbitrary external image_url", async () => {
    const supabase = makeSupabase({});
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      imageUrl: "https://evil.example/photo.jpg",
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      retryable: false,
    });
    expect(supabase._createSignedUrl).not.toHaveBeenCalled();
  });

  it("cannot resolve another tenant storage path via image_url", async () => {
    const supabase = makeSupabase({});
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      imageUrl: `media/${otherTenant}/sess/x.jpg`,
    });
    expect(result).toMatchObject({
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
    });
    expect(supabase._createSignedUrl).not.toHaveBeenCalled();
  });

  describe("adversarial media.file_url poisoning", () => {
    const cases: Array<{ name: string; file_url: string }> = [
      {
        name: "direct object path of other tenant",
        file_url: `${otherTenant}/secret.jpg`,
      },
      {
        name: "public URL of other tenant",
        file_url: `${supabaseOrigin}/storage/v1/object/public/media/${otherTenant}/secret.jpg`,
      },
      {
        name: "authenticated URL of other tenant",
        file_url: `${supabaseOrigin}/storage/v1/object/authenticated/media/${otherTenant}/secret.jpg`,
      },
      {
        name: "signed URL of other tenant",
        file_url: `${supabaseOrigin}/storage/v1/object/sign/media/${otherTenant}/secret.jpg?token=x`,
      },
      {
        name: "double media prefix other tenant",
        file_url: `${supabaseOrigin}/storage/v1/object/public/media/media/${otherTenant}/secret.jpg`,
      },
    ];

    for (const c of cases) {
      it(`denies poisoned file_url (${c.name}) without signing`, async () => {
        const supabase = makeSupabase({
          media: {
            id: mediaId,
            tenant_id: tenantId, // row claims job tenant
            project_id: projectId,
            file_url: c.file_url,
          },
        });
        const result = await resolveAIMediaImage(supabase, {
          tenantId,
          mediaId,
          projectId,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
          expect(result.retryable).toBe(false);
        }
        expect(supabase._createSignedUrl).not.toHaveBeenCalled();
      });
    }
  });

  describe("adversarial path attacks", () => {
    const attacks: Array<{ name: string; imageUrl: string; code: string }> = [
      {
        name: "../ traversal",
        imageUrl: `${tenantId}/../${otherTenant}/x.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
      {
        name: "encoded traversal",
        imageUrl: `${tenantId}/%2e%2e/${otherTenant}/x.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
      {
        name: "double-encoded traversal",
        imageUrl: `${tenantId}/%252e%252e%252f${otherTenant}/x.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
      {
        name: "backslash",
        imageUrl: `${tenantId}\\x.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
      {
        name: "malformed percent",
        imageUrl: `${tenantId}/file%.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
      {
        name: "similar tenant prefix",
        imageUrl: `${tenantId}abcd/x.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      },
      {
        name: "other supabase origin",
        imageUrl: `https://other.supabase.co/storage/v1/object/public/media/${tenantId}/x.jpg`,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
      {
        name: "arbitrary external URL",
        imageUrl: "https://evil.example/img.jpg",
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      },
    ];

    for (const a of attacks) {
      it(`blocks ${a.name} without calling createSignedUrl`, async () => {
        const supabase = makeSupabase({});
        const result = await resolveAIMediaImage(supabase, {
          tenantId,
          imageUrl: a.imageUrl,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.code).toBe(a.code);
        expect(supabase._createSignedUrl).not.toHaveBeenCalled();
      });
    }

    it("accepts double media/media prefix for current tenant", async () => {
      const supabase = makeSupabase({ signedUrl: "https://signed.example/ok" });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `media/media/${tenantId}/ok.jpg`,
      });
      expect(result.ok).toBe(true);
      expect(supabase._createSignedUrl).toHaveBeenCalledWith(`${tenantId}/ok.jpg`, 900);
    });

    it("accepts valid legacy path for current tenant", async () => {
      const supabase = makeSupabase({ signedUrl: "https://signed.example/legacy" });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `${tenantId}/legacy.jpg`,
      });
      expect(result.ok).toBe(true);
    });
  });
});
