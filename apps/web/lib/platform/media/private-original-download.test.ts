import { beforeEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadPrivateOriginal } from "./private-original-download";
const info = vi.fn(), stream = vi.fn(), download = vi.fn();
const metadata = { size: 3, contentType: "image/png", version: "fixture-version", etag: "fixture-digest" };
const client = { storage: { from: () => ({ info, download }) } } as unknown as SupabaseClient;
beforeEach(() => {
  vi.resetAllMocks(); info.mockResolvedValue({ data: { ...metadata }, error: null });
  download.mockReturnValue({ asStream: stream });
  stream.mockResolvedValue({ data: new Response(new Uint8Array([1, 2, 3])).body, error: null });
});
it("uses authenticated SDK streaming and exact MIME/bytes with strict transport options", async () => {
  const r = await downloadPrivateOriginal(client, "tenant/project/photo.png", 3);
  expect(new Uint8Array(await r.data!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3])); expect(r.data!.type).toBe("image/png");
  expect(download).toHaveBeenCalledWith("tenant/project/photo.png", {}, expect.objectContaining({ redirect: "error", cache: "no-store", signal: expect.any(AbortSignal) }));
  expect(info).toHaveBeenCalledTimes(2);
});
it("rejects known oversized objects before starting their stream", async () => {
  info.mockResolvedValue({ data: { ...metadata, size: 4 }, error: null });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 413 } }); expect(download).not.toHaveBeenCalled();
});
it("caps and cancels actual bytes despite incorrect metadata size", async () => {
  const cancel = vi.fn(); let chunks = 0;
  const data = new ReadableStream<Uint8Array>({ pull(c) { c.enqueue(new Uint8Array(2)); chunks++; }, cancel });
  stream.mockResolvedValue({ data, error: null });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 413 } });
  expect(cancel).toHaveBeenCalledTimes(1); expect(chunks).toBeLessThanOrEqual(4);
});
it("refuses truncated originals", async () => {
  stream.mockResolvedValue({ data: new Response(new Uint8Array(2)).body, error: null });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 503 } });
});
it("never falls back to buffered SDK download when streaming is absent", async () => {
  stream.mockResolvedValue({ data: null, error: null });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 503 } });
});
it.each([{ version: "changed" }, { etag: "changed" }, { contentType: "text/html" }, { size: 4 }])("denies object changes after I/O %j", async patch => {
  info.mockResolvedValueOnce({ data: metadata, error: null }).mockResolvedValueOnce({ data: { ...metadata, ...patch }, error: null });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 503 } });
});
it("preserves RLS denial and sanitizes private errors", async () => {
  info.mockResolvedValueOnce({ data: null, error: { message: "private credential" } });
  const r = await downloadPrivateOriginal(client, "path", 3); expect(r.error?.status).toBe(503); expect(JSON.stringify(r)).not.toContain("credential"); expect(download).not.toHaveBeenCalled();
});
