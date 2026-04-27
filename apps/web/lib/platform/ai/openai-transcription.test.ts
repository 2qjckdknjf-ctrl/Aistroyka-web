import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithOpenAiRetry } from "./openai-http-retry";
import { normalizeWhisperLanguage, transcribeOpenAiAudio } from "./openai-transcription";

vi.mock("./openai-http-retry", () => ({
  fetchWithOpenAiRetry: vi.fn(),
}));

describe("normalizeWhisperLanguage", () => {
  it("maps BCP-47 to ISO-639-1 base", () => {
    expect(normalizeWhisperLanguage("ru-RU")).toBe("ru");
    expect(normalizeWhisperLanguage("en_US")).toBe("en");
    expect(normalizeWhisperLanguage("  FR-ca  ")).toBe("fr");
  });

  it("returns null for invalid hints", () => {
    expect(normalizeWhisperLanguage(null)).toBeNull();
    expect(normalizeWhisperLanguage("")).toBeNull();
    expect(normalizeWhisperLanguage("toolongcode")).toBeNull();
  });
});

describe("transcribeOpenAiAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses verbose_json payload and returns text + duration", async () => {
    vi.mocked(fetchWithOpenAiRetry).mockResolvedValueOnce(
      new Response(JSON.stringify({ text: "hello world", duration: 3.5 }), { status: 200 })
    );

    const result = await transcribeOpenAiAudio({
      apiKey: "sk-test",
      model: "whisper-1",
      audioBytes: new Uint8Array([1, 2, 3]),
      filename: "clip.webm",
      mimeType: "audio/webm",
      language: "en",
      timeoutMs: 60_000,
      maxRetries: 1,
    });

    expect(result.text).toBe("hello world");
    expect(result.durationSeconds).toBe(3.5);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("adds language field only for valid 2-letter locale hint", async () => {
    vi.mocked(fetchWithOpenAiRetry).mockImplementationOnce(async (_url, getInit) => {
      const init = getInit(new AbortController().signal);
      const form = init.body as FormData;
      expect(form.get("language")).toBe("ru");
      return new Response(JSON.stringify({ text: "ok", duration: 1 }), { status: 200 });
    });

    await transcribeOpenAiAudio({
      apiKey: "sk-test",
      model: "whisper-1",
      audioBytes: new Uint8Array([1]),
      filename: "clip.wav",
      mimeType: "audio/wav",
      language: "ru",
      timeoutMs: 30_000,
      maxRetries: 0,
    });

    vi.mocked(fetchWithOpenAiRetry).mockImplementationOnce(async (_url, getInit) => {
      const init = getInit(new AbortController().signal);
      const form = init.body as FormData;
      expect(form.get("language")).toBe("ru");
      return new Response(JSON.stringify({ text: "ok", duration: 1 }), { status: 200 });
    });

    await transcribeOpenAiAudio({
      apiKey: "sk-test",
      model: "whisper-1",
      audioBytes: new Uint8Array([1]),
      filename: "clip.wav",
      mimeType: "audio/wav",
      language: "ru-RU",
      timeoutMs: 30_000,
      maxRetries: 0,
    });
  });

  it("throws on non-OK or invalid JSON response", async () => {
    vi.mocked(fetchWithOpenAiRetry).mockResolvedValueOnce(new Response("upstream err", { status: 503 }));
    await expect(
      transcribeOpenAiAudio({
        apiKey: "sk-test",
        model: "whisper-1",
        audioBytes: new Uint8Array([1]),
        filename: "clip.wav",
        mimeType: "audio/wav",
        timeoutMs: 30_000,
        maxRetries: 0,
      })
    ).rejects.toThrow(/openai_transcription_http_503/i);

    vi.mocked(fetchWithOpenAiRetry).mockResolvedValueOnce(new Response("not-json", { status: 200 }));
    await expect(
      transcribeOpenAiAudio({
        apiKey: "sk-test",
        model: "whisper-1",
        audioBytes: new Uint8Array([1]),
        filename: "clip.wav",
        mimeType: "audio/wav",
        timeoutMs: 30_000,
        maxRetries: 0,
      })
    ).rejects.toThrow(/openai_transcription_invalid_json/i);
  });
});
