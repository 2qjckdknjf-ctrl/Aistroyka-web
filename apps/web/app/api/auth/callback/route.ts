import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureOnboardingProfileExists,
  hasTenantMembership,
  linkIdentityRow,
} from "@/lib/auth/multi-provider";
import { toSafeRelativePath } from "@/lib/auth/password-recovery";

export const dynamic = "force-dynamic";

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
  if (provider === "apple" || provider === "google") {
    await linkIdentityRow(supabase, {
      user_id: user.id,
      provider,
      provider_user_id: String(user.user_metadata?.sub ?? user.id),
      email: user.email ?? null,
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : null,
      avatar_url:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : null,
      metadata: {
        provider,
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
