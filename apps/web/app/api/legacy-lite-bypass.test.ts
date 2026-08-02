/**
 * Phase 2D — direct-handler legacy lite bypass matrix.
 * Invokes exported handlers as functions (no middleware).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const LITE_PROFILES = ["ios_lite", "android_lite", "ios_worker", "android_worker"] as const;
const FULL_CLIENTS = ["web", "ios_full", "android_full"] as const;

vi.mock("@/lib/domain/projects/project.service", () => ({
  listProjects: vi.fn(async () => {
    throw new Error("listProjects must not run on legacy routes");
  }),
  createProject: vi.fn(async () => {
    throw new Error("createProject must not run on legacy routes");
  }),
  getProject: vi.fn(async () => {
    throw new Error("getProject must not run on legacy routes");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    throw new Error("createClient must not run on legacy routes");
  }),
  createClientFromRequest: vi.fn(async () => {
    throw new Error("createClientFromRequest must not run on legacy routes");
  }),
  getSessionUser: vi.fn(async () => {
    throw new Error("getSessionUser must not run on legacy routes");
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => {
    throw new Error("getAdminClient must not run on legacy routes");
  }),
}));

vi.mock("@/lib/supabase/rpc", () => ({
  getProjectById: vi.fn(async () => {
    throw new Error("getProjectById must not run on legacy routes");
  }),
  triggerAnalysisForMedia: vi.fn(async () => {
    throw new Error("triggerAnalysisForMedia must not run on legacy routes");
  }),
}));

vi.mock("@/lib/api/engine", () => ({
  createAnalysisJob: vi.fn(async () => {
    throw new Error("createAnalysisJob must not run on legacy routes");
  }),
  MEDIA_BUCKET: "media",
}));

vi.mock("@/lib/platform/ai/ai.service", () => ({
  analyzeImage: vi.fn(async () => {
    throw new Error("analyzeImage must not run on legacy routes");
  }),
  AIPolicyBlockedError: class extends Error {},
  AIVisionFailedError: class extends Error {},
}));

type Handler = (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>;

const ROUTES: Array<{
  name: string;
  method: string;
  url: string;
  params?: Record<string, string>;
  load: () => Promise<{ handler: Handler; sourcePath: string }>;
  v1Location: string;
}> = [
  {
    name: "GET /api/projects",
    method: "GET",
    url: "https://x/api/projects?page=1",
    v1Location: "https://x/api/v1/projects?page=1",
    load: async () => {
      const mod = await import("@/app/api/projects/route");
      return { handler: mod.GET, sourcePath: "app/api/projects/route.ts" };
    },
  },
  {
    name: "POST /api/projects",
    method: "POST",
    url: "https://x/api/projects",
    v1Location: "https://x/api/v1/projects",
    load: async () => {
      const mod = await import("@/app/api/projects/route");
      return { handler: mod.POST, sourcePath: "app/api/projects/route.ts" };
    },
  },
  {
    name: "GET /api/projects/:id",
    method: "GET",
    url: "https://x/api/projects/proj-1?view=full",
    params: { id: "proj-1" },
    v1Location: "https://x/api/v1/projects/proj-1?view=full",
    load: async () => {
      const mod = await import("@/app/api/projects/[id]/route");
      return { handler: mod.GET, sourcePath: "app/api/projects/[id]/route.ts" };
    },
  },
  {
    name: "POST /api/projects/:id/jobs/:jobId/trigger",
    method: "POST",
    url: "https://x/api/projects/proj-1/jobs/job-9/trigger",
    params: { id: "proj-1", jobId: "job-9" },
    v1Location: "https://x/api/v1/projects/proj-1/jobs/job-9/trigger",
    load: async () => {
      const mod = await import("@/app/api/projects/[id]/jobs/[jobId]/trigger/route");
      return {
        handler: mod.POST,
        sourcePath: "app/api/projects/[id]/jobs/[jobId]/trigger/route.ts",
      };
    },
  },
  {
    name: "POST /api/projects/:id/media/:mediaId/trigger",
    method: "POST",
    url: "https://x/api/projects/proj-1/media/media-2/trigger",
    params: { id: "proj-1", mediaId: "media-2" },
    v1Location: "https://x/api/v1/projects/proj-1/media/media-2/trigger",
    load: async () => {
      const mod = await import("@/app/api/projects/[id]/media/[mediaId]/trigger/route");
      return {
        handler: mod.POST,
        sourcePath: "app/api/projects/[id]/media/[mediaId]/trigger/route.ts",
      };
    },
  },
  {
    name: "GET /api/projects/:id/poll-status",
    method: "GET",
    url: "https://x/api/projects/proj-1/poll-status",
    params: { id: "proj-1" },
    v1Location: "https://x/api/v1/projects/proj-1/poll-status",
    load: async () => {
      const mod = await import("@/app/api/projects/[id]/poll-status/route");
      return { handler: mod.GET, sourcePath: "app/api/projects/[id]/poll-status/route.ts" };
    },
  },
  {
    name: "POST /api/projects/:id/upload",
    method: "POST",
    url: "https://x/api/projects/proj-1/upload",
    params: { id: "proj-1" },
    v1Location: "https://x/api/v1/projects/proj-1/upload",
    load: async () => {
      const mod = await import("@/app/api/projects/[id]/upload/route");
      return { handler: mod.POST, sourcePath: "app/api/projects/[id]/upload/route.ts" };
    },
  },
  {
    name: "POST /api/ai/analyze-image",
    method: "POST",
    url: "https://x/api/ai/analyze-image?trace=1",
    v1Location: "https://x/api/v1/ai/analyze-image?trace=1",
    load: async () => {
      const mod = await import("@/app/api/ai/analyze-image/route");
      return { handler: mod.POST, sourcePath: "app/api/ai/analyze-image/route.ts" };
    },
  },
  {
    name: "POST /api/ai/analyze-video-daily",
    method: "POST",
    url: "https://x/api/ai/analyze-video-daily",
    v1Location: "https://x/api/v1/ai/analyze-video-daily",
    load: async () => {
      const mod = await import("@/app/api/ai/analyze-video-daily/route");
      return { handler: mod.POST, sourcePath: "app/api/ai/analyze-video-daily/route.ts" };
    },
  },
  {
    name: "POST /api/ai/transcribe",
    method: "POST",
    url: "https://x/api/ai/transcribe",
    v1Location: "https://x/api/v1/ai/transcribe",
    load: async () => {
      const mod = await import("@/app/api/ai/transcribe/route");
      return { handler: mod.POST, sourcePath: "app/api/ai/transcribe/route.ts" };
    },
  },
];

describe("2D legacy lite bypass — direct handlers", () => {
  for (const route of ROUTES) {
    describe(route.name, () => {
      it("forbids every field-worker profile with no redirect and no side effects", async () => {
        const { handler, sourcePath } = await route.load();
        const src = readFileSync(join(process.cwd(), sourcePath), "utf8");
        expect(src).toMatch(/redirectLegacyApiToV1/);
        expect(src).not.toMatch(/createProject|createClient|getAdminClient|analyzeImage|createAnalysisJob/);

        for (const profile of LITE_PROFILES) {
          const req = new Request(route.url, {
            method: route.method,
            headers: {
              "x-client": profile,
              "content-type": "application/json",
            },
            body: route.method === "GET" ? undefined : JSON.stringify({ name: "x", image_url: "https://e.com/a.jpg" }),
          });
          const res = await handler(req, {
            params: Promise.resolve(route.params ?? {}),
          });
          expect(res.status, profile).toBe(403);
          expect(res.headers.get("location"), profile).toBeNull();
          const body = (await res.json()) as { error: string; code: string };
          expect(body).toEqual({ error: "forbidden", code: "lite_client_path_forbidden" });
        }
      });

      it("redirects web/full clients to canonical v1 with query and path preserved", async () => {
        const { handler } = await route.load();
        for (const client of FULL_CLIENTS) {
          const req = new Request(route.url, {
            method: route.method,
            headers: { "x-client": client },
            body: route.method === "GET" ? undefined : JSON.stringify({ name: "ok" }),
          });
          const res = await handler(req, {
            params: Promise.resolve(route.params ?? {}),
          });
          expect(res.status, client).toBe(307);
          expect(res.headers.get("location"), client).toBe(route.v1Location);
          expect(res.headers.get("Deprecation")).toBe("true");
        }
      });
    });
  }

  it("canonical v1/projects no longer re-exports legacy handlers", () => {
    const src = readFileSync(join(process.cwd(), "app/api/v1/projects/route.ts"), "utf8");
    expect(src).not.toMatch(/from ["']@\/app\/api\/projects\/route["']/);
    expect(src).toMatch(/listProjects/);
    expect(src).toMatch(/createProject/);
  });
});
