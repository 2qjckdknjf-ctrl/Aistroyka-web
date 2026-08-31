import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  getUserIdentities,
  summarizeAuthMethods,
  unlinkIdentityRow,
  unlinkSupabaseAuthProvider,
  type IdentityProvider,
} from "@/lib/auth/multi-provider";

const UnlinkSchema = z.object({
  action: z.literal("unlink"),
  provider: z.enum(["apple", "telegram", "google"]),
});

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

export async function GET() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const identities = await getUserIdentities(supabase, user.id);
  const methods = summarizeAuthMethods(user.email, identities);
  return NextResponse.json(toResponse(methods));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = UnlinkSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const identities = await getUserIdentities(supabase, user.id);
  const methods = summarizeAuthMethods(user.email, identities);
  if (methods.linkedCount <= 1) {
    return NextResponse.json({ error: "last_method_forbidden" }, { status: 400 });
  }

  const provider = parsed.data.provider as IdentityProvider;
  switch (provider) {
    case "apple":
    case "google": {
      const unlinked = await unlinkSupabaseAuthProvider(supabase, provider);
      if (!unlinked) {
        return NextResponse.json({ error: "unlink_failed" }, { status: 400 });
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

  const removed = await unlinkIdentityRow(supabase, user.id, provider);
  if (!removed) {
    return NextResponse.json({ error: "unlink_failed" }, { status: 500 });
  }

  const nextIdentities = await getUserIdentities(supabase, user.id);
  const nextMethods = summarizeAuthMethods(user.email, nextIdentities);
  return NextResponse.json(toResponse(nextMethods));
}
