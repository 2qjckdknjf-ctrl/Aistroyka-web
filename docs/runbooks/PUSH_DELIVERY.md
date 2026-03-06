# Push Delivery Runbook

Outbox-based push: enqueue to `push_outbox`, drain via `push_send` job. APNS (iOS) and FCM (Android) providers are env-gated.

## Flow

1. **Enqueue** — Call `enqueuePush(supabase, { tenantId, userId, platform, type, payload })` (e.g. from worker report submitted, task assigned). Inserts into `push_outbox` (status `queued`) and enqueues a `push_send` job (dedupe_key `push_drain`).
2. **Drain** — Job handler `push_send` runs (via cron calling `POST /api/v1/jobs/process`). It selects queued outbox rows (optionally where `next_retry_at` is null or past), loads device tokens for that tenant/user/platform (excluding `disabled_at`), and calls the push provider per token.
3. **Status** — Outbox row is updated to `sent`, or `failed` with `last_error`, or left `queued` with `attempts` incremented, `last_error`, and `next_retry_at` (exponential backoff: 1m, 5m, 15m, 1h).
4. **Token hygiene** — If the provider returns `invalid_token`, the corresponding `device_tokens` row is updated with `disabled_at` so it is not used again.

## Provider configuration

- **APNS**: `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` (or `APNS_KEY`), `APNS_BUNDLE_ID`, `APNS_ENV=production|sandbox`. Token-based auth (JWT).
- **FCM**: Prefer **HTTP v1** (service account) when set; otherwise **legacy** server key. If neither is set, provider returns retryable and outbox stays queued for retry.

### FCM HTTP v1 (recommended)

Set these to use FCM HTTP v1 (OAuth2 JWT):

- `FCM_PROJECT_ID` — Firebase project ID.
- `FCM_CLIENT_EMAIL` — Service account email (e.g. `firebase-adminsdk-xxx@project.iam.gserviceaccount.com`).
- `FCM_PRIVATE_KEY` — PEM private key (literal `\n` in env is normalized to newline).
- `FCM_TOKEN_URI` (optional) — Default `https://oauth2.googleapis.com/token`.

Router selects v1 when all of project ID, client email, and private key are present; otherwise falls back to legacy `FCM_SERVER_KEY` if set.

### FCM legacy (server key)

- `FCM_SERVER_KEY` — Legacy server key from Firebase Console. Deprecated by Google; migrate to HTTP v1 when possible.

### Migrating from legacy FCM key to HTTP v1

1. In Firebase Console: Project settings → Service accounts → Generate new private key. Download the JSON.
2. Set `FCM_PROJECT_ID` to the project ID, `FCM_CLIENT_EMAIL` to `client_email` from the JSON, and `FCM_PRIVATE_KEY` to the `private_key` value (paste as single line with `\n` for newlines, or multi-line in env files that support it).
3. Deploy; the app prefers v1 when these are set. You can remove `FCM_SERVER_KEY` after verifying sends succeed.

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
