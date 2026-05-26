import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureOnboardingProfileExists,
  hasTenantMembership,
  linkIdentityRow,
} from "@/lib/auth/multi-provider";

export const dynamic = "force-dynamic";

function toSafeRelativePath(input: string | null | undefined, fallback: string): string {
  const value = (input ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

function localeFromPath(pathname: string): string {
  const match = pathname.match(/^\/(ru|en|es|it)(?=\/|$)/);
  return match?.[1] ?? "ru";
}

function hasLocalePrefix(pathname: string): boolean {
  return /^\/(ru|en|es|it)(?=\/|$)/.test(pathname);
}

function withLocalePath(pathname: string, locale: string): string {
  if (hasLocalePrefix(pathname)) return pathname;
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const explicitNext = url.searchParams.get("next");
  const callbackPath = toSafeRelativePath(url.searchParams.get("callback"), "/en/dashboard");
  const locale = localeFromPath(callbackPath);

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=missing_code`, request.url));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_exchange_failed`, request.url));
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_no_user`, request.url));
  }

  const provider = user.app_metadata?.provider;
  const appleIdentity = user.identities?.find((identity) => identity.provider === "apple");
  if (appleIdentity || provider === "apple") {
    const appleData = (appleIdentity?.identity_data ?? {}) as Record<string, unknown>;
    const fallbackData = (user.user_metadata ?? {}) as Record<string, unknown>;
    await linkIdentityRow(supabase, {
      user_id: user.id,
      provider: "apple",
      provider_user_id: String(appleData.sub ?? appleIdentity?.identity_id ?? user.user_metadata?.sub ?? user.id),
      email: readString(appleData.email) ?? user.email ?? null,
      full_name: readString(appleData.full_name) ?? readString(fallbackData.full_name),
      avatar_url:
        readString(appleData.avatar_url) ??
        readString(appleData.picture) ??
        readString(fallbackData.avatar_url),
      metadata: {
        provider: "apple",
      },
    });
  }

  await ensureOnboardingProfileExists(supabase, user.id, {
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
  });

  const member = await hasTenantMembership(supabase, user.id);
  const fallbackTarget = member
    ? `/${locale}/dashboard`
    : `/${locale}/dashboard?onboarding=1`;
  const next = withLocalePath(toSafeRelativePath(explicitNext, fallbackTarget), locale);
  return NextResponse.redirect(new URL(next, request.url));
}
