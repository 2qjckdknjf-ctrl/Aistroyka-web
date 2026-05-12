/**
 * POST /api/v1/integrations/telegram/webhook — Telegram Bot updates (Phase 10).
 * Verifies X-Telegram-Bot-Api-Secret-Token when TELEGRAM_WEBHOOK_SECRET is set.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTelegramWebhookSecret } from "@/lib/platform/telegram/telegram.config";
import { sendTelegramMessage } from "@/lib/platform/telegram/telegram-api.client";
import {
  consumeLinkToken,
  insertDeliveryAudit,
  replaceUserTelegramLink,
} from "@/lib/platform/telegram/telegram.repository";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { id?: number | string };
  };
};

function extractStartToken(text: string | undefined): string | null {
  if (!text || !text.startsWith("/start")) return null;
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const token = parts[1]!.trim();
  return token.length > 0 ? token : null;
}

export async function POST(request: Request) {
  const isProd = process.env.NODE_ENV === "production";
  const configuredSecret = getTelegramWebhookSecret();
  if (isProd && !configuredSecret) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (configuredSecret) {
    const hdr = request.headers.get("x-telegram-bot-api-secret-token");
    if (hdr !== configuredSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const msg = update.message;
  if (!msg?.chat?.id) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  const fromId = msg.from?.id != null ? String(msg.from.id) : chatId;
  const token = extractStartToken(msg.text);

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 });

  if (!token) {
    if (msg.text?.trim().startsWith("/start")) {
      await sendTelegramMessage({
        chatId,
        text: "Open Aistroyka, generate a Telegram link, then press Start here with the token from that link.",
      });
    }
    return NextResponse.json({ ok: true });
  }

  const resolved = await consumeLinkToken(admin, token);
  if (!resolved) {
    await sendTelegramMessage({
      chatId,
      text: "This link is invalid or expired. Create a new link from your Aistroyka profile.",
    });
    await insertDeliveryAudit(admin, {
      tenant_id: null,
      recipient_user_id: null,
      kind: "link_failed",
      ok: false,
      error_text: "invalid_or_expired_token",
    });
    return NextResponse.json({ ok: true });
  }

  const ok = await replaceUserTelegramLink(admin, {
    tenantId: resolved.tenantId,
    userId: resolved.userId,
    telegramUserId: fromId,
    telegramChatId: chatId,
  });
  await insertDeliveryAudit(admin, {
    tenant_id: resolved.tenantId,
    recipient_user_id: resolved.userId,
    kind: "link_completed",
    ok,
    error_text: ok ? null : "db_write_failed",
  });

  await sendTelegramMessage({
    chatId,
    text: ok
      ? "Aistroyka notifications are linked. You can mute this chat anytime in Telegram."
      : "Could not save the link. Try again from the dashboard.",
  });

  return NextResponse.json({ ok: true });
}
