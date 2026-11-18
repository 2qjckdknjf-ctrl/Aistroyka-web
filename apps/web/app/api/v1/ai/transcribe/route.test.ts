import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { getById as getMediaById } from "@/lib/domain/media/media.repository";
import { indexTranscriptionResult } from "@/lib/domain/media-captions/index-transcription-result";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({ from: vi.fn() }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/copilot/copilot-ai-gate", () => ({
  gateTenantAiRequest: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  recordUsage: vi.fn().mockResolvedValue(undefined),
  checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/domain/media/media.repository", () => ({
  getById: vi.fn(),
}));

vi.mock("@/lib/domain/media-captions/index-transcription-result", () => ({
  indexTranscriptionResult: vi.fn(),
}));

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn(() => ({
    OPENAI_API_KEY: "sk-test",
    OPENAI_TRANSCRIPTION_MODEL: "whisper-1",
    OPENAI_TRANSCRIPTION_TIMEOUT_MS: 60_000,
    OPENAI_TRANSCRIPTION_MAX_RETRIES: 0,
  })),
  isOpenAIConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    subscriptionTier: "free",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class extends Error {},
}));

function minWebmPayload(): Uint8Array {
  const b = new Uint8Array(40);
  b.set([0x1a, 0x45, 0xdf, 0xa3]);
  return b;
}

describe("POST /api/v1/ai/transcribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "hello site", duration: 2.5 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("returns 413 when Content-Length exceeds bound", async () => {
    const max = 25 * 1024 * 1024 + 512 * 1024 + 1;
    const fd = new FormData();
    const req = new Request("https://x/api/v1/ai/transcribe", {
      method: "POST",
      headers: { "content-length": String(max) },
      body: fd,
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("returns 400 when file field missing", async () => {
    const fd = new FormData();
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when audio payload is too small", async () => {
    const tiny = new File([new Uint8Array([1, 2, 3])], "tiny.webm", { type: "audio/webm" });
    const fd = new FormData();
    fd.append("file", tiny);
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 415 for explicitly unsupported mime type", async () => {
    const bad = new File([minWebmPayload()], "clip.bin", { type: "application/pdf" });
    const fd = new FormData();
    fd.append("file", bad);
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("returns 415 when mime is empty and sniff cannot infer audio format", async () => {
    const unknown = new Uint8Array(64).fill(0x7f);
    const file = new File([unknown], "clip.bin", { type: "" });
    const fd = new FormData();
    fd.append("file", file);
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(415);
  });

  it("returns 200 with text when file present", async () => {
    const file = new File([minWebmPayload()], "clip.webm", { type: "audio/webm" });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("locale", "en");
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      data: { text: string; segments: unknown[]; caption_index: null };
    };
    expect(j.data.text).toBe("hello site");
    expect(j.data.segments).toEqual([]);
    expect(j.data.caption_index).toBeNull();
    expect(indexTranscriptionResult).not.toHaveBeenCalled();
  });

  it("indexes caption segments when project_id and media_id scope match", async () => {
    vi.mocked(getMediaById).mockResolvedValueOnce({
      id: "11111111-1111-4111-8111-111111111111",
      project_id: "22222222-2222-4222-8222-222222222222",
      tenant_id: "t1",
      type: "audio",
      file_url: "https://x/a.webm",
      uploaded_at: "2026-10-30T00:00:00.000Z",
    } as never);
    vi.mocked(indexTranscriptionResult).mockResolvedValueOnce({
      indexed: true,
      inserted: 1,
    });

    const file = new File([minWebmPayload()], "clip.webm", { type: "audio/webm" });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("project_id", "22222222-2222-4222-8222-222222222222");
    fd.append("media_id", "11111111-1111-4111-8111-111111111111");
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      data: { caption_index: { indexed: boolean; inserted: number } };
    };
    expect(j.data.caption_index).toEqual({ indexed: true, inserted: 1, code: null });
    expect(indexTranscriptionResult).toHaveBeenCalled();
  });

  it("infers WebM when file type is empty", async () => {
    const file = new File([minWebmPayload()], "clip.bin", { type: "" });
    const fd = new FormData();
    fd.append("file", file);
    const req = new Request("https://x/api/v1/ai/transcribe", { method: "POST", body: fd });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
