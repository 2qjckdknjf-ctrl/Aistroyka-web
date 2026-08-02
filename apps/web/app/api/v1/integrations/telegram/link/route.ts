/**
 * GET /api/v1/integrations/telegram/link — linking status.
 * POST — mint deep link (Telegram bot not configured → 503).
 * DELETE — unlink Telegram for current user/tenant.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantForbiddenError, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getTelegramBotUsername } from "@/lib/platform/telegram/telegram.config";
import { isTelegramBotConfigured } from "@/lib/platform/telegram/telegram.config";
import {
  computeLinkExpiryIso,
  deleteUserTelegramLink,
  getTelegramChatForUser,
  insertLinkToken,
  mintLinkToken,
} from "@/lib/platform/telegram/telegram.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const admin = getAdminClient();
  if (!admin || !ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ linked: false, botConfigured: isTelegramBotConfigured() }, { status: 200 });
  }
  const chatId = await getTelegramChatForUser(admin, { tenantId: ctx.tenantId, userId: ctx.userId });
  return NextResponse.json({
    linked: !!chatId,
    botConfigured: isTelegramBotConfigured(),
  });
}

export async function POST(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  if (!isTelegramBotConfigured()) {
    return NextResponse.json({ error: "telegram_bot_not_configured" }, { status: 503 });
  }
  const botUser = getTelegramBotUsername();
  if (!botUser || !ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "misconfigured" }, { status: 503 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const token = mintLinkToken();
  const expiresAt = computeLinkExpiryIso();
  const inserted = await insertLinkToken(admin, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    token,
    expiresAtIso: expiresAt,
  });
  if (!inserted) return NextResponse.json({ error: "could_not_create_token" }, { status: 500 });

  const deepLink = `https://t.me/${encodeURIComponent(botUser)}?start=${encodeURIComponent(token)}`;
  return NextResponse.json({ deepLink, expiresAt });
}

export async function DELETE(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const admin = getAdminClient();
  if (!admin || !ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  await deleteUserTelegramLink(admin, { tenantId: ctx.tenantId, userId: ctx.userId });
  return NextResponse.json({ ok: true });
}
