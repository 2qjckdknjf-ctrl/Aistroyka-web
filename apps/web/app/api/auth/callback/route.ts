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

  const isRecovery = url.searchParams.get("recovery") === "1";
  if (isRecovery) {
    const recoveryPath = toSafeRelativePath(url.searchParams.get("callback"), `/${locale}/reset-password`);
    return NextResponse.redirect(new URL(recoveryPath, request.url));
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=oauth_no_user`, request.url));
  }

  const provider = user.app_metadata?.provider;
  if (provider === "apple") {
    await linkIdentityRow(supabase, {
      user_id: user.id,
      provider: "apple",
      provider_user_id: String(user.user_metadata?.sub ?? user.id),
      email: user.email ?? null,
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
      avatar_url:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
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
  const next = toSafeRelativePath(explicitNext, fallbackTarget);
  return NextResponse.redirect(new URL(next, request.url));
}
