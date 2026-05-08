# Phase 10 — Telegram bot layer (design)

**Roadmap:** PHASE 10 — TELEGRAM BOT LAYER  
**Scope:** v1 implementation in `apps/web` — linking + customer-safe outbound messages only.

## Goals

- Telegram is an **optional notification channel**, not primary auth.
- **Owner / stakeholder** messages contain only commercial-safe prompts (same class as email to portal).
- **Manager** pings on new client requests contain **no** internal costs, margin, or budget language.

## Architecture

| Piece | Location |
|-------|----------|
| Link tokens (short TTL) | `telegram_link_tokens` |
| User ↔ Telegram mapping | `user_telegram_links` |
| Delivery audit | `telegram_delivery_audit` |
| Bot webhook | `POST /api/v1/integrations/telegram/webhook` |
| Mint / unlink | `GET/POST/DELETE /api/v1/integrations/telegram/link` |
| Emit on client request | `emitTelegramForNewClientRequest` after stakeholder email hook |

## Linking flow

1. Authenticated user calls `POST /api/v1/integrations/telegram/link` → receives `https://t.me/<bot>?start=<token>`.
2. User opens bot, sends `/start <token>`.
3. Webhook validates `X-Telegram-Bot-Api-Secret-Token`, consumes token, stores `telegram_user_id` + `telegram_chat_id`.
4. **Production** requires `TELEGRAM_WEBHOOK_SECRET` (see security doc).

## Notification copy (v1)

- **Stakeholder:** mirrors email — project name, request title, link to client portal path.
- **Manager / owner on project:** short line + link to client view (`/en/dashboard/projects/.../client`). No financial figures.

## Future (not v1)

- Inline approval buttons (callback_query) with signed deep links to web.
- Worker task reminders via Telegram (separate policy review).
- Rate limits and per-tenant bot allow-list.

## Verification

- `bun run --cwd apps/web test lib/platform/telegram/telegram-api.client.test.ts app/api/v1/integrations/telegram/webhook/route.test.ts`
