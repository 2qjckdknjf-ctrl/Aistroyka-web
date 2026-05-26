# Telegram Auth Setup (AISTROYKA)

## Overview

AISTROYKA uses a secure custom Telegram auth bridge:

- Telegram signed payload is verified server-side via HMAC-SHA-256.
- Verified identities map into `public.user_identities` (`provider = telegram`).
- Session is issued through existing Supabase session architecture.
- Tenant/project access still requires membership (`tenant_members` / tenant owner), not login alone.

## Bot Creation (BotFather)

1. Open Telegram -> `@BotFather`.
2. Run `/newbot` and create bot name/username.
3. Save bot token securely (do not commit).
4. Optional hardening:
   - set profile photo/logo
   - set clear display name/description
   - set commands for support/onboarding.

## Domain Configuration

Use `/setdomain` in BotFather:

- Production domain: `https://aistroyka.ai`
- Staging domain (if login tested there): `https://staging.aistroyka.ai`

Domain must match Telegram login widget origin.

## Required Environment Variables

- `TELEGRAM_BOT_TOKEN` (server secret, required when Telegram auth is enabled)
- `TELEGRAM_BOT_USERNAME` (or `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` for UI widget)
- optional flag for release checks:
  - `TELEGRAM_AUTH_ENABLED=true`

Never expose bot token to browser/client bundles.

## Endpoint

`POST /api/v1/auth/telegram`

Accepted payload:

- `id`
- `first_name`
- `last_name`
- `username`
- `photo_url`
- `auth_date`
- `hash`

Server validates:

1. required fields
2. freshness (`auth_date` TTL)
3. HMAC signature:
   - `data_check_string` sorted alphabetically
   - `secret_key = SHA256(TELEGRAM_BOT_TOKEN)`
   - compare via timing-safe equality

## Security Notes

- Reject stale payloads.
- Reject invalid hashes.
- Never log/return bot token.
- Do not auto-grant tenant/project access after Telegram login.
- On identity conflicts (Telegram ID already linked to another user), return safe 409 error.

## Recommended Bot UX

- Name the bot clearly (e.g. "AISTROYKA Auth").
- Keep avatar aligned with AISTROYKA brand.
- Keep consent/entry copy explicit: login only, no automatic tenant access.
