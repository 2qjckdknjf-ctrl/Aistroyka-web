# Push Delivery Runbook

Outbox-based push: enqueue to `push_outbox`, drain via `push_send` job. APNS (iOS) and FCM (Android) providers are env-gated.

## Flow

1. **Enqueue** — Call `enqueuePush(supabase, { tenantId, userId, platform, type, payload })` (e.g. from worker report submitted, task assigned). Inserts into `push_outbox` (status `queued`) and enqueues a `push_send` job (dedupe_key `push_drain`).
2. **Drain** — Job handler `push_send` runs (via cron calling `POST /api/v1/jobs/process`). It selects queued outbox rows (optionally where `next_retry_at` is null or past), loads device tokens for that tenant/user/platform (excluding `disabled_at`), and calls the push provider per token.
3. **Status** — Outbox row is updated to `sent`, or `failed` with `last_error`, or left `queued` with `attempts` incremented, `last_error`, and `next_retry_at` (exponential backoff: 1m, 5m, 15m, 1h).
4. **Token hygiene** — If the provider returns `invalid_token`, the corresponding `device_tokens` row is updated with `disabled_at` so it is not used again.

## Provider configuration

- **APNS**: `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` (or `APNS_KEY`), `APNS_BUNDLE_ID`, `APNS_ENV=production|sandbox`. Token-based auth (JWT).
- **FCM** (Android):
  - **HTTP v1 (preferred):** `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (PEM; env may contain literal `\n` for newlines). Optional: `FCM_TOKEN_URI` (default `https://oauth2.googleapis.com/token`). Uses OAuth2 JWT; token cached in-memory.
  - **Legacy:** `FCM_SERVER_KEY`. Deprecated; use v1 for new setups.
  - **Selection:** If v1 env is present (project_id + client_email + private_key), v1 is used; else if `FCM_SERVER_KEY` is set, legacy is used. If neither, provider returns retryable and outbox stays queued for retry.
  - **Migration from legacy:** Create a service account in Firebase Console → Project Settings → Service accounts → Generate new private key. Set `FCM_PROJECT_ID` (project ID), `FCM_CLIENT_EMAIL` (client_email from JSON), `FCM_PRIVATE_KEY` (private_key from JSON; escape newlines as `\n` if needed). Remove `FCM_SERVER_KEY` after verifying v1 sends.

## Scheduling

- Ensure `POST /api/v1/jobs/process` is called periodically (e.g. every 1–2 minutes) via cron with `x-cron-secret` if `REQUIRE_CRON_SECRET` is true.
- Each run processes up to `DRAIN_LIMIT` (20) outbox rows and any other job types.

## Admin

- **Enqueue test push**: `POST /api/v1/admin/push/test` (admin auth). Body: `{ "user_id?", "platform?", "type?" }`.
- Optional: outbox inspection endpoint (if implemented) for status/debugging.

## Troubleshooting

- **No sends**: Check APNS/FCM env; check `device_tokens` has rows and `disabled_at` is null.
- **invalid_token**: Normal; tokens are disabled and the outbox row can be marked sent if at least one token succeeded, or failed if all invalid.
- **Retryable errors**: Outbox row stays queued with `next_retry_at`; next job run will retry.
