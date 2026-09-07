import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureOnboardingProfileExists,
  hasTenantMembership,
  linkIdentityRow,
  type IdentityProvider,
} from "@/lib/auth/multi-provider";
import { toSafeRelativePath } from "@/lib/auth/password-recovery";

export const dynamic = "force-dynamic";

function localeFromPath(pathname: string): string {
  const match = pathname.match(/^\/(ru|en|es|it)(?=\/|$)/);
  return match?.[1] ?? "ru";
}

function oauthProvider(value: string | null): Exclude<IdentityProvider, "telegram"> | null {
  return value === "apple" || value === "google" ? value : null;
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

  const requestedProvider = oauthProvider(url.searchParams.get("provider"));
  const primaryProvider = oauthProvider(
    typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null
  );
  const provider = requestedProvider ?? primaryProvider;
  const authIdentity = provider
    ? user.identities?.find((identity) => identity.provider === provider)
    : undefined;

  if (provider && authIdentity) {
    const identityData = authIdentity.identity_data ?? {};
    const providerUserId =
      typeof identityData.sub === "string" && identityData.sub.length > 0
        ? identityData.sub
        : authIdentity.identity_id || authIdentity.id;
    const linkResult = await linkIdentityRow(supabase, {
      user_id: user.id,
      provider,
      identity_id: authIdentity.identity_id || authIdentity.id,
      provider_user_id: providerUserId,
      email:
        typeof identityData.email === "string"
          ? identityData.email
          : user.email ?? null,
      full_name:
        typeof identityData.full_name === "string"
          ? identityData.full_name
          : typeof identityData.name === "string"
            ? identityData.name
            : typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : typeof user.user_metadata?.name === "string"
                ? user.user_metadata.name
                : null,
      avatar_url:
        typeof identityData.avatar_url === "string"
          ? identityData.avatar_url
          : typeof identityData.picture === "string"
            ? identityData.picture
            : typeof user.user_metadata?.avatar_url === "string"
              ? user.user_metadata.avatar_url
              : typeof user.user_metadata?.picture === "string"
                ? user.user_metadata.picture
                : null,
      metadata: {
        provider,
        identity_id: authIdentity.identity_id || authIdentity.id,
      },
    });
    if (!linkResult.ok && url.searchParams.get("intent") === "link") {
      return NextResponse.redirect(new URL(`${callbackPath}?error=oauth_link_persist_failed`, request.url));
    }
  } else if (url.searchParams.get("intent") === "link" && requestedProvider) {
    return NextResponse.redirect(new URL(`${callbackPath}?error=oauth_identity_missing`, request.url));
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
