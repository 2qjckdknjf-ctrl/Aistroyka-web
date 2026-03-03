import { NextResponse } from "next/server";

/**
 * Safe auth diagnostics for production login troubleshooting.
 * Returns only non-sensitive data; anon key is masked (first 6 + last 4).
 */
function maskKey(key: string | undefined): string | null {
  if (typeof key !== "string" || key.length === 0) return null;
  if (key.length <= 10) return "***";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
  const requestHost = request.headers.get("host") ?? null;
  const requestOrigin = request.headers.get("origin") ?? null;
  const envName = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null;

  const supabaseUrlHost =
    typeof url === "string" && url.length > 0
      ? (() => {
          try {
            return new URL(url).host;
          } catch {
            return url.slice(0, 50);
          }
        })()
      : null;

  const body = {
    appUrl: appUrl?.trim() || null,
    supabaseUrlHost,
    anonKeyPresent: typeof key === "string" && key.length > 0,
    anonKeyMasked: maskKey(key),
    requestHost,
    requestOrigin,
    envName,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body);
}
