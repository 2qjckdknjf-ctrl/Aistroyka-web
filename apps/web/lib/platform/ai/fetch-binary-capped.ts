/**
 * Fetch remote binary with a hard byte cap (videos for Gemini upload).
 */

export class FetchBinaryCapError extends Error {
  constructor(
    message: string,
    readonly code: "too_large" | "fetch_failed" | "empty"
  ) {
    super(message);
    this.name = "FetchBinaryCapError";
  }
}

function mergeContentType(header: string | null): string {
  const h = (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  return h || "application/octet-stream";
}

/**
 * Optional HEAD to reject oversized bodies early; then GET with streaming cap.
 */
export async function fetchBinaryWithByteCap(
  url: string,
  maxBytes: number,
  opts?: { signal?: AbortSignal; headTimeoutMs?: number; fetchTimeoutMs?: number; redirect?: RequestRedirect; cache?: RequestCache; requireStream?: boolean }
): Promise<{ data: Uint8Array; contentType: string }> {
  const headTimeout = opts?.headTimeoutMs ?? 15_000;
  const fetchTimeout = opts?.fetchTimeoutMs ?? 180_000;
  const headSignal = AbortSignal.timeout(headTimeout);

  try {
    const head = await fetch(url, { method: "HEAD", signal: headSignal, redirect: opts?.redirect, cache: opts?.cache });
    if (head.ok) {
      const cl = head.headers.get("content-length");
      if (cl) {
        const n = Number(cl);
        if (Number.isFinite(n) && n > maxBytes) {
          throw new FetchBinaryCapError("Video exceeds size limit for this plan.", "too_large");
        }
      }
    }
  } catch (e) {
    if (e instanceof FetchBinaryCapError) throw e;
    // HEAD unsupported or failed — continue with capped GET
  }

  const signal = opts?.signal ?? AbortSignal.timeout(fetchTimeout);
  const res = await fetch(url, { signal, redirect: opts?.redirect, cache: opts?.cache });
  if (!res.ok) {
    throw new FetchBinaryCapError(`Video fetch failed: HTTP ${res.status}`, "fetch_failed");
  }

  const contentType = mergeContentType(res.headers.get("content-type"));
  const length = Number(res.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw new FetchBinaryCapError("Binary exceeds size limit", "too_large");
  }
  const reader = res.body?.getReader();
  if (!reader) {
    if (opts?.requireStream) throw new FetchBinaryCapError("Streaming body unavailable", "fetch_failed");
    const buf = await res.arrayBuffer();
    const u = new Uint8Array(buf);
    if (u.length === 0) throw new FetchBinaryCapError("Empty video body", "empty");
    if (u.length > maxBytes) throw new FetchBinaryCapError("Video exceeds size limit for this plan.", "too_large");
    return { data: u, contentType };
  }

  reader.releaseLock();
  const data = await readBinaryStreamWithByteCap(res.body!, maxBytes);
  return { data, contentType };
}

/** Shared bounded reader for fetch responses and authenticated SDK streams. */
export async function readBinaryStreamWithByteCap(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.length) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new FetchBinaryCapError("Video exceeds size limit for this plan.", "too_large");
    }
    chunks.push(value);
  }

  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }

  if (total === 0) throw new FetchBinaryCapError("Empty video body", "empty");
  const data = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    data.set(c, off);
    off += c.length;
  }
  return data;
}
