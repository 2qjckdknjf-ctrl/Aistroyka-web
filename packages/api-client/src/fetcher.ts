/**
 * Minimal fetch wrapper: base URL + path, optional Bearer token and JSON body.
 */

export interface FetcherOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  headers?: Record<string, string>;
}

export async function fetcher<T>(
  options: FetcherOptions,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${options.baseUrl.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const token = options.getToken ? await options.getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
    throw new Error(err?.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
