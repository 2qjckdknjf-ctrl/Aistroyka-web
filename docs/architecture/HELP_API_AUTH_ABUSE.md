# Help API Auth & Abuse Controls

Date: 2026-07-25  
Batch: `2C_lite_idempotency_rate_limits` (second corrective pass)

## Auth decision

`POST /api/v1/help/assistant`, `POST /api/v1/help/hints`, and `POST /api/v1/help/assistant/events` require **tenant-authenticated** context (`getTenantContextFromRequest` + `requireTenant`).

Rationale:

- Dashboard (`AIGuidePanel`, `HelpStartChecklist`, `LaunchConfidenceBanner`) and mobile lite clients already call these with session credentials.
- Body fields `role`, `projectCount`, `getStarted`, etc. are **UX hints for static KB ranking only** — never used for authorization or to invent tenant membership.
- Accidental public access is closed; anonymous callers receive 401/403.

## Abuse controls

| Control | Behavior |
| --- | --- |
| Guard order | **auth → peek completed lite replay → rate limit → strict claim → handler → finalize**. Completed replay does **not** burn rate budget. Pending/new claims are always rate-limited (no abuse bypass). |
| Rate limit | Single RPC `rate_limit_try_increment_multi`: tenant+user(+trusted IP) locked in sorted key order, all-or-nothing charge. Plan lookup failure → **503** (never fall back to HELP caps alone). Effective limits = `min(help_cap, plan)`. |
| Trusted IP | `cf-connecting-ip` trusted **only** when `AISTROYKA_TRUST_CF_CONNECTING_IP=1` (Worker wrangler vars). Parsed/normalized IPv4/IPv6 required. Vercel/local/direct must not open IP buckets from client headers. Tenant+user always mandatory. |
| Lite idempotency | Strict claim returns opaque `claim_token`; finalize/release require token match. Expired reclaim issues a new token so a late prior handler cannot finalize/delete the new claim. Unique only via PG `23505`. |
| Schema | Event type enum; size bounds; invalid JSON → 400; oversize → 413 |
| Events insert | Check Supabase returned `error`; finalize failure → 503 leaving pending |

## Privacy

Request query/history/payload are not written to structured logs by these routes.

## Non-goals / blockers

- Legacy worker routes keep `requireLiteIdempotency` default (legacy fail-open).
- Migration `20260725190000_rate_limit_try_increment.sql` is **not applied** — production enablement BLOCKED until applied.
- Live Postgres transaction concurrency proof is **not available** in this environment (no `supabase/config.toml`, no Docker). Algorithm-twin + SQL contract tests cover semantics locally; they are not DB concurrency proof.
