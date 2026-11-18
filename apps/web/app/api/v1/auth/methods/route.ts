import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getUserIdentities,
  linkIdentityRow,
  summarizeAuthMethods,
  unlinkIdentityRow,
  unlinkSupabaseAuthProvider,
  type IdentityProvider,
  type IdentityRow,
} from "@/lib/auth/multi-provider";

const UnlinkSchema = z.object({
  action: z.literal("unlink"),
  provider: z.enum(["apple", "telegram", "google"]),
});

type AuthUserForMethods = {
  id: string;
  email?: string | null;
  identities?: Array<{ provider?: string }> | null;
};

function toResponse(methods: ReturnType<typeof summarizeAuthMethods>) {
  return {
    methods: {
      email: methods.email,
      apple: methods.apple,
      telegram: methods.telegram,
      google: methods.google,
    },
    linkedCount: methods.linkedCount,
  };
}

function realEmailMethod(user: AuthUserForMethods): string | undefined {
  const hasEmailIdentity = user.identities?.some((identity) => identity.provider === "email") ?? false;
  return hasEmailIdentity ? user.email ?? undefined : undefined;
}

async function getFullSessionUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AuthUserForMethods | null> {
  try {
    const res = await supabase.auth.getUser();
    const user = res?.data?.user ?? null;
    if (!user?.id) return null;
    return {
      id: user.id,
      email: user.email ?? undefined,
      identities: user.identities?.map((identity) => ({ provider: identity.provider })) ?? null,
    };
  } catch {
    return null;
  }
}

async function restoreIdentityRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: IdentityRow
): Promise<boolean> {
  const restored = await linkIdentityRow(supabase, {
    user_id: row.user_id,
    provider: row.provider,
    identity_id: row.identity_id,
    provider_user_id: row.provider_user_id,
    email: row.email,
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    metadata: row.metadata,
  });
  return restored.ok;
}

export async function GET() {
  const supabase = await createClient();
  const user = await getFullSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const identities = await getUserIdentities(supabase, user.id);
  const methods = summarizeAuthMethods(realEmailMethod(user), identities);
  return NextResponse.json(toResponse(methods));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getFullSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = UnlinkSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const identities = await getUserIdentities(supabase, user.id);
  const methods = summarizeAuthMethods(realEmailMethod(user), identities);
  if (methods.linkedCount <= 1) {
    return NextResponse.json({ error: "last_method_forbidden" }, { status: 400 });
  }

  const provider = parsed.data.provider as IdentityProvider;
  const linkedRow = identities.find((identity) => identity.provider === provider);
  if (!linkedRow) {
    return NextResponse.json({ error: "identity_not_linked" }, { status: 404 });
  }

  // Delete the app-side row first. If the external Auth unlink fails, restore the row so
  // Auth and public.user_identities do not silently diverge.
  const removed = await unlinkIdentityRow(supabase, user.id, provider);
  if (!removed) {
    return NextResponse.json({ error: "unlink_failed" }, { status: 500 });
  }

  switch (provider) {
    case "apple":
    case "google": {
      const unlinked = await unlinkSupabaseAuthProvider(supabase, provider);
      if (!unlinked) {
        const restored = await restoreIdentityRow(supabase, linkedRow);
        return NextResponse.json(
          { error: restored ? "unlink_failed" : "unlink_compensation_failed" },
          { status: 500 }
        );
      }
      break;
    }
    case "telegram":
      break;
    default: {
      const _exhaustive: never = provider;
      return NextResponse.json({ error: `unhandled ${_exhaustive}` }, { status: 400 });
    }
  }

  const nextIdentities = await getUserIdentities(supabase, user.id);
  const nextMethods = summarizeAuthMethods(realEmailMethod(user), nextIdentities);
  return NextResponse.json(toResponse(nextMethods));
}
