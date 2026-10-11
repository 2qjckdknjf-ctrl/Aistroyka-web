import { beforeEach, afterEach, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadPrivateOriginal } from "./private-original-download";
vi.mock("@/lib/config", () => ({ getPublicConfig: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://vthfrxehrursfloevnlp.supabase.co" }) }));
const url = "https://vthfrxehrursfloevnlp.supabase.co/storage/v1/object/sign/media/tenant/project/photo.png?token=synthetic";
const sign = vi.fn(), fetcher = vi.fn();
const client = { storage: { from: () => ({ createSignedUrl: sign }) } } as unknown as SupabaseClient;
beforeEach(() => { vi.resetAllMocks(); sign.mockResolvedValue({ data: { signedUrl: url }, error: null }); vi.stubGlobal("fetch", fetcher); });
afterEach(() => vi.unstubAllGlobals());
it("returns original bytes while forbidding redirects/shared caching", async () => {
  fetcher.mockResolvedValueOnce(new Response(null, { status: 200, headers: { "Content-Length": "3" } }))
    .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "image/png" } }));
  const r = await downloadPrivateOriginal(client, "tenant/project/photo.png", 3);
  expect(new Uint8Array(await r.data!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  expect(sign).toHaveBeenCalledWith("tenant/project/photo.png", 30);
  for (const [, options] of fetcher.mock.calls) expect(options).toMatchObject({ redirect: "error", cache: "no-store" });
});
it("rejects advertised oversized bodies before GET", async () => {
  fetcher.mockResolvedValue(new Response(null, { headers: { "Content-Length": "4" } }));
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 413 } }); expect(fetcher).toHaveBeenCalledTimes(1);
});
it("cancels a chunked body when its unadvertised size crosses the cap", async () => {
  const cancel = vi.fn(); let chunk = 0;
  const body = new ReadableStream<Uint8Array>({ pull(controller) { controller.enqueue(new Uint8Array(2)); chunk++; }, cancel });
  fetcher.mockResolvedValueOnce(new Response(null, { status: 405 })).mockResolvedValueOnce(new Response(body, { headers: { "Content-Type": "image/png" } }));
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 413 } });
  expect(cancel).toHaveBeenCalledTimes(1); expect(chunk).toBeLessThanOrEqual(4);
});
it("rejects a false Content-Length when the actual stream is oversized", async () => {
  fetcher.mockResolvedValueOnce(new Response(null, { status: 405 })).mockResolvedValueOnce(new Response(new Uint8Array(4), { headers: { "Content-Length": "1" } }));
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 413 } });
});
it.each(["https://foreign.test/storage/v1/object/sign/media/file?token=synthetic", "http://vthfrxehrursfloevnlp.supabase.co/storage/v1/object/sign/media/file?token=synthetic", "https://vthfrxehrursfloevnlp.supabase.co/auth/v1/user?token=synthetic", url.replace("?token=synthetic", ""), url + "#fragment"])("refuses untrusted signer destination before HTTP %s", async signedUrl => {
  sign.mockResolvedValue({ data: { signedUrl }, error: null });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 503 } }); expect(fetcher).not.toHaveBeenCalled();
});
it("does not fall back to an uncapped arrayBuffer if the response lacks a stream", async () => {
  const arrayBuffer = vi.fn(); fetcher.mockResolvedValueOnce(new Response(null, { status: 405 }))
    .mockResolvedValueOnce({ ok: true, headers: new Headers(), body: null, arrayBuffer });
  expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 503 } }); expect(arrayBuffer).not.toHaveBeenCalled();
});
it("keeps expired/denied signer and empty/network failure explicit without private URLs", async () => {
  sign.mockResolvedValueOnce({ data: null, error: { message: url } });
  expect(JSON.stringify(await downloadPrivateOriginal(client, "path", 3))).not.toContain("token"); expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockRejectedValue(new Error(url)); expect(await downloadPrivateOriginal(client, "path", 3)).toMatchObject({ data: null, error: { status: 503 } });
});
