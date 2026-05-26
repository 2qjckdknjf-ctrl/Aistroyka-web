import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  deriveTelegramPseudoEmail,
  deriveTelegramServicePassword,
  isTelegramAuthStale,
  verifyTelegramHash,
  type TelegramAuthPayload,
} from "@/lib/auth/telegram-auth";
import {
  ensureOnboardingProfileExists,
  hasTenantMembership,
  linkIdentityRow,
} from "@/lib/auth/multi-provider";

export const dynamic = "force-dynamic";

const TelegramPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().optional().default(""),
  username: z.string().trim().optional().default(""),
  photo_url: z.string().trim().optional().default(""),
  auth_date: z.union([z.string(), z.number()]).transform((v) => String(v)),
  hash: z.string().trim().min(1),
});

type RoutePayload = z.infer<typeof TelegramPayloadSchema>;

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

async function signInPseudoTelegramAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  telegramId: string,
  botToken: string
): Promise<{ ok: true; user: SupabaseUserLike } | { ok: false }> {
  const email = deriveTelegramPseudoEmail(telegramId);
  const password = deriveTelegramServicePassword(telegramId, botToken);
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user) return { ok: false };
  return { ok: true, user: result.data.user };
}

async function issueSessionViaMagicLink(
  supabase: Awaited<ReturnType<typeof createClient>>,
  admin: NonNullable<ReturnType<typeof getAdminClient>>,
  userId: string
): Promise<boolean> {
  const userRes = await admin.auth.admin.getUserById(userId);
  const email = userRes.data.user?.email?.trim();
  if (!email) return false;

  const generated = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL,
    },
  });
  const tokenHash = generated.data?.properties?.hashed_token;
  if (generated.error || !tokenHash) return false;

  const verifyResult = await (supabase.auth as any).verifyOtp({
    type: "magiclink",
    email,
    token_hash: tokenHash,
  });
  return !verifyResult.error;
}

function toSafeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  if (!botToken) {
    return NextResponse.json({ ok: false, error: "telegram_not_configured" }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = TelegramPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  const payload = parsed.data as RoutePayload;
  const verificationPayload: TelegramAuthPayload = payload;

  if (isTelegramAuthStale(payload.auth_date)) {
    return NextResponse.json({ ok: false, error: "stale_auth_date" }, { status: 401 });
  }
  if (!verifyTelegramHash(verificationPayload, botToken)) {
    return NextResponse.json({ ok: false, error: "invalid_hash" }, { status: 401 });
  }

  const supabase = await createClient();
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "server_unavailable" }, { status: 503 });
  }

  const currentUser = await getSessionUser(supabase);
  const providerUserId = payload.id;

  const { data: existingIdentity, error: identityLookupError } = await admin
    .from("user_identities")
    .select("user_id")
    .eq("provider", "telegram")
    .eq("provider_user_id", providerUserId)
    .maybeSingle();
  if (identityLookupError) {
    return NextResponse.json({ ok: false, error: "identity_lookup_failed" }, { status: 500 });
  }

  const identityRow = existingIdentity as { user_id?: string } | null;
  const targetUserId = currentUser?.id ?? identityRow?.user_id ?? null;
  let resolvedUserId = targetUserId;
  let sessionIssued = false;

  if (!resolvedUserId) {
    const pseudoLogin = await signInPseudoTelegramAccount(supabase, payload.id, botToken);
    if (pseudoLogin.ok) {
      resolvedUserId = pseudoLogin.user.id;
      sessionIssued = true;
    } else {
      const email = deriveTelegramPseudoEmail(payload.id);
      const password = deriveTelegramServicePassword(payload.id, botToken);
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim() || null,
          username: payload.username || null,
          avatar_url: payload.photo_url || null,
          telegram_id: payload.id,
        },
      });
      if (created.error || !created.data.user?.id) {
        return NextResponse.json({ ok: false, error: "user_create_failed" }, { status: 500 });
      }
      resolvedUserId = created.data.user.id;
      const loginCreated = await signInPseudoTelegramAccount(supabase, payload.id, botToken);
      sessionIssued = loginCreated.ok;
    }
  }

  if (!resolvedUserId) {
    return NextResponse.json({ ok: false, error: "user_resolution_failed" }, { status: 500 });
  }

  const linked = await linkIdentityRow(admin, {
    user_id: resolvedUserId,
    provider: "telegram",
    provider_user_id: payload.id,
    username: payload.username || null,
    full_name: [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim() || null,
    avatar_url: payload.photo_url || null,
    metadata: {
      auth_date: payload.auth_date,
      telegram_username: payload.username || null,
    },
  });
  if (!linked.ok) {
    if (linked.code === "identity_conflict") {
      return NextResponse.json({ ok: false, error: "identity_conflict" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "identity_link_failed" }, { status: 500 });
  }

  await ensureOnboardingProfileExists(supabase, resolvedUserId, {
    fullName: [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim() || null,
  });

  if (!currentUser && !sessionIssued) {
    sessionIssued = await issueSessionViaMagicLink(supabase, admin, resolvedUserId);
  }

  if (!currentUser && !sessionIssued) {
    return NextResponse.json({ ok: false, error: "session_issue_failed" }, { status: 500 });
  }

  const hasMembership = await hasTenantMembership(supabase, resolvedUserId);
  const requestedNext = toSafeNext((json as Record<string, unknown> | null)?.next);
  const locale = typeof (json as Record<string, unknown> | null)?.locale === "string" ? (json as Record<string, unknown>).locale : "ru";
  const fallbackNext = hasMembership
    ? `/${locale}/dashboard`
    : `/${locale}/dashboard?onboarding=1`;

  return NextResponse.json({
    ok: true,
    linkedOnly: Boolean(currentUser),
    next: requestedNext ?? fallbackNext,
    hasTenantMembership: hasMembership,
  });
}
