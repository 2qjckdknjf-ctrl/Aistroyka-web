# Phase 10 — Telegram security model

## Threats

| Risk | Mitigation |
|------|------------|
| Webhook spoofing | In **production**, `TELEGRAM_WEBHOOK_SECRET` must be set; Telegram sends it as `X-Telegram-Bot-Api-Secret-Token`. Missing secret → webhook returns 503. |
| Token reuse | `telegram_link_tokens` deleted on successful consume; TTL ~15 minutes. |
| Telegram account takeover | Linking replaces any prior row for the same `telegram_user_id` or `(tenant_id, user_id)`. |
| Internal finance leak | Outbound templates are fixed strings + portal URLs only; no cost API data. |
| Privilege escalation | Webhook uses **service role** only for token table + link table writes; no user session on webhook. |

## Env vars (server-only)

| Variable | Required | Notes |
|----------|----------|-------|
| `TELEGRAM_BOT_TOKEN` | For sending + bot identity | From @BotFather |
| `TELEGRAM_BOT_USERNAME` | For deep links | Without `@` |
| `TELEGRAM_WEBHOOK_SECRET` | **Required in production** | Same value passed to `setWebhook` `secret_token` |

Do not expose `TELEGRAM_BOT_TOKEN` or `TELEGRAM_WEBHOOK_SECRET` to the client.

## RLS

`telegram_link_tokens`, `user_telegram_links`, `telegram_delivery_audit` have **RLS enabled** with **no** authenticated policies — application uses service role in trusted API routes only.

## Audit

`telegram_delivery_audit` records success/failure for link completion and each outbound notification attempt (best-effort).
