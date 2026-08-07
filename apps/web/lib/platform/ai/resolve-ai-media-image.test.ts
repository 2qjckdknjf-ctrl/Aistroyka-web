import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSignedUrlForPath, resolveAIMediaImage } from "./resolve-ai-media-image";
import { AI_ERROR_CODES } from "./ai-media-errors";

vi.mock("@/lib/config", () => ({
  getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }),
}));

type TableRow = Record<string, unknown> | null;

function makeSupabase(opts: {
  media?: TableRow;
  session?: TableRow;
  report?: TableRow;
  task?: TableRow;
  day?: TableRow;
  /** Map of projectId → tenant_id that owns it (or null = missing). */
  projects?: Record<string, string | null>;
  projectQueryError?: boolean;
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

  const projects = opts.projects ?? {};

  return {
    from: vi.fn((table: string) => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => {
          if (table === "media") return { data: opts.media ?? null, error: null };
          if (table === "upload_sessions") return { data: opts.session ?? null, error: null };
          if (table === "worker_reports") return { data: opts.report ?? null, error: null };
          if (table === "worker_tasks") return { data: opts.task ?? null, error: null };
          if (table === "worker_day") return { data: opts.day ?? null, error: null };
          if (table === "projects") {
            if (opts.projectQueryError) {
              return { data: null, error: { message: "db error" } };
            }
            // Collect eq filters from chain calls
            const eqs: Array<[string, string]> = chain._eqCalls ?? [];
            const idEq = eqs.find((e) => e[0] === "id")?.[1];
            const tenantEq = eqs.find((e) => e[0] === "tenant_id")?.[1];
            if (!idEq || !tenantEq) return { data: null, error: null };
            const owner = projects[idEq];
            if (owner && owner === tenantEq) {
              return { data: { id: idEq }, error: null };
            }
            return { data: null, error: null };
          }
          return { data: null, error: null };
        }),
        _eqCalls: [] as Array<[string, string]>,
      };
      chain.eq = vi.fn((col: string, val: string) => {
        chain._eqCalls.push([col, val]);
        return chain;
      });
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
const foreignProject = "66666666-6666-4666-8666-666666666666";
const reportId = "77777777-7777-4777-8777-777777777777";
const taskId = "88888888-8888-4888-8888-888888888888";
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
      projects: { [projectId]: tenantId },
      signedUrl: "https://signed.example/media",
    });
    const result = await resolveAIMediaImage(supabase, {
      tenantId,
      mediaId,
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

  it("falls back from pending media_id to finalized upload_session_id", async () => {
    const supabase = makeSupabase({
      media: {
        id: mediaId,
        tenant_id: tenantId,
        project_id: projectId,
        file_url: null,
      },
      projects: { [projectId]: tenantId },
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
    });
    expect(supabase._createSignedUrl).not.toHaveBeenCalled();
  });

  describe("attacker-controlled project claim / path", () => {
    it("denies foreign project path even with matching claim UUID", async () => {
      const supabase = makeSupabase({
        projects: { [foreignProject]: otherTenant },
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `${foreignProject}/secret.jpg`,
        projectIdClaim: foreignProject,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
        expect(result.message).not.toContain(foreignProject);
        expect(result.message).not.toContain(otherTenant);
      }
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("denies path using foreign tenant UUID as first segment", async () => {
      const supabase = makeSupabase({
        projects: {}, // tenant UUID is not a project owned by tenantA
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `${otherTenant}/secret.jpg`,
        projectIdClaim: otherTenant,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("fail-closed when claim differs from report-derived project", async () => {
      const supabase = makeSupabase({
        report: {
          id: reportId,
          tenant_id: tenantId,
          task_id: taskId,
          day_id: null,
        },
        task: { project_id: projectId },
        projects: { [projectId]: tenantId, [foreignProject]: otherTenant },
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        reportId,
        imageUrl: `${tenantId}/ok.jpg`,
        projectIdClaim: foreignProject,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("fail-closed when claim UUID belongs to another tenant", async () => {
      const supabase = makeSupabase({
        projects: { [foreignProject]: otherTenant },
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `${tenantId}/ok.jpg`,
        projectIdClaim: foreignProject,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe("trusted derivation", () => {
    it("signs valid legacy project path when report→task→projects proves ownership", async () => {
      const supabase = makeSupabase({
        report: {
          id: reportId,
          tenant_id: tenantId,
          task_id: taskId,
          day_id: null,
        },
        task: { project_id: projectId },
        projects: { [projectId]: tenantId },
        signedUrl: "https://signed.example/legacy-project",
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        reportId,
        imageUrl: `${projectId}/photo.jpg`,
      });
      expect(result.ok).toBe(true);
      expect(supabase._createSignedUrl).toHaveBeenCalledWith(`${projectId}/photo.jpg`, 900);
      if (result.ok) expect(result.trustedProjectId).toBe(projectId);
    });

    it("does not sign when derived project missing from projects", async () => {
      const supabase = makeSupabase({
        report: {
          id: reportId,
          tenant_id: tenantId,
          task_id: taskId,
          day_id: null,
        },
        task: { project_id: projectId },
        projects: {}, // missing
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        reportId,
        imageUrl: `${projectId}/photo.jpg`,
      });
      expect(result.ok).toBe(false);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("does not sign when projects query errors", async () => {
      const supabase = makeSupabase({
        projectQueryError: true,
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `${projectId}/photo.jpg`,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY);
        expect(result.retryable).toBe(true);
        expect(result.message).not.toContain(projectId);
      }
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("does not sign when media.project_id is foreign", async () => {
      const supabase = makeSupabase({
        media: {
          id: mediaId,
          tenant_id: tenantId,
          project_id: foreignProject,
          file_url: `${projectId}/secret.jpg`,
        },
        projects: { [foreignProject]: otherTenant, [projectId]: tenantId },
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        mediaId,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("signs when media.project_id belongs to current tenant (legacy path)", async () => {
      const supabase = makeSupabase({
        media: {
          id: mediaId,
          tenant_id: tenantId,
          project_id: projectId,
          file_url: `${projectId}/ok.jpg`,
        },
        projects: { [projectId]: tenantId },
        signedUrl: "https://signed.example/media-project",
      });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        mediaId,
      });
      expect(result.ok).toBe(true);
      expect(supabase._createSignedUrl).toHaveBeenCalledWith(`${projectId}/ok.jpg`, 900);
    });
  });

  describe("central signing chokepoint", () => {
    it("cannot sign foreign project path via direct createSignedUrlForPath", async () => {
      const supabase = makeSupabase({
        projects: { [foreignProject]: otherTenant },
      });
      const result = await createSignedUrlForPath(supabase, `${foreignProject}/secret.jpg`, {
        tenantId,
      });
      expect(result.ok).toBe(false);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("cannot bypass guard by using foreign tenant UUID as project prefix", async () => {
      const supabase = makeSupabase({ projects: {} });
      const result = await createSignedUrlForPath(supabase, `${otherTenant}/secret.jpg`, {
        tenantId,
      });
      expect(result.ok).toBe(false);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });

    it("signs tenant-prefixed path for current tenant", async () => {
      const supabase = makeSupabase({ signedUrl: "https://signed.example/t" });
      const result = await createSignedUrlForPath(supabase, `${tenantId}/ok.jpg`, { tenantId });
      expect(result.ok).toBe(true);
      expect(supabase._createSignedUrl).toHaveBeenCalledWith(`${tenantId}/ok.jpg`, 900);
    });

    it("rejects tenant-prefixed path of another tenant", async () => {
      const supabase = makeSupabase({});
      const result = await createSignedUrlForPath(supabase, `${otherTenant}/ok.jpg`, { tenantId });
      expect(result.ok).toBe(false);
      expect(supabase._createSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe("adversarial media.file_url poisoning (non-regression)", () => {
    const cases: Array<{ name: string; file_url: string }> = [
      { name: "direct object path of other tenant", file_url: `${otherTenant}/secret.jpg` },
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
            tenant_id: tenantId,
            project_id: projectId,
            file_url: c.file_url,
          },
          projects: { [projectId]: tenantId },
        });
        const result = await resolveAIMediaImage(supabase, {
          tenantId,
          mediaId,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
        }
        expect(supabase._createSignedUrl).not.toHaveBeenCalled();
      });
    }
  });

  describe("adversarial path attacks (non-regression)", () => {
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

    it("accepts valid legacy tenant path", async () => {
      const supabase = makeSupabase({ signedUrl: "https://signed.example/legacy" });
      const result = await resolveAIMediaImage(supabase, {
        tenantId,
        imageUrl: `${tenantId}/legacy.jpg`,
      });
      expect(result.ok).toBe(true);
    });
  });
});
