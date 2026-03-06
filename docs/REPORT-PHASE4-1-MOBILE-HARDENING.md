# Phase 4.1 — Mobile Reliability Hardening to Production

**Project:** AISTROYKA.AI  
**Phase:** 4.1 — Mobile Reliability Hardening (no UI, no product expansion).  
**Status:** Complete.

**Non-negotiables:** No v1 API contract breaks (worker/sync/media/devices); preserve Phase 1–4; env-gated risk; tests per change; runbooks + this report.

---

## Stage 0 — Baseline checkpoint

- **0.1 Working tree:** Not clean (branch has other changes); report and Phase 4.1 work proceed on current branch.
- **0.2 Report skeleton:** Created.
- **0.3 Baseline:** Vitest 269 tests passed (58 files). cf:build: `opennextjs-cloudflare` CLI not installed (npm script invokes it; package not in package.json); documented in Stage 4.

---

## Stage 1 — FCM HTTP v1 (service account)

- **Goal:** Replace legacy FCM_SERVER_KEY with FCM HTTP v1 auth.
- **Env vars:** `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`; optional `FCM_TOKEN_URI`.
- **Migration:** See runbook PUSH_DELIVERY.md — set v1 env from service account JSON; app prefers v1 when set.
- **Tests:** google-oauth (JWT, token exchange mock), provider.fcm_v1 (send shape, error mapping), router prefers v1 when configured.

---

## Stage 2 — Optional storage existence check on finalize

- **Goal:** Env-gated verification that object exists before finalize.
- **Flags:** `MEDIA_FINALIZE_VERIFY_OBJECT` (default false); `MEDIA_FINALIZE_VERIFY_STRICT` (default false). See runbook MOBILE_UPLOADS.
- **Tests:** Flag off unchanged; flag on + missing object → 400 media_object_missing; flag on + storage error and strict off → finalize proceeds.

---

## Stage 3 — Sync conflict detection hardening

- **Goal:** Retention boundary + device mismatch → 409 with stable contract.
- **Env:** `SYNC_MIN_RETAINED_CURSOR` (optional; 0 = disabled).
- **Hints:** `retention_window_exceeded` (cursor &lt; min retained), `device_mismatch` (cursor behind stored for this device). See runbook MOBILE_SYNC.
- **Tests:** getMinRetainedCursor; changes/ack 409 for retention and device_mismatch; valid cursor 200 unchanged.

---

## Stage 4 — Build/CI clarity

- **Canonical checks:** Tests (`npm run test`) + cf:build (`npm run cf:build`) from apps/web. Next build optional.
- **Docs:** docs/operations/BUILD_AND_RELEASE.md. CI (apps/web/.github/workflows/ci.yml) runs lint, test, cf:build with working-directory apps/web.

---

## Stage 5 — Final verification

- **Commands run:** From `apps/web`: `npm install --legacy-peer-deps`, `npm run test -- --run`, (optional `npm run cf:build` if OpenNext CLI available).
- **Result:** 292 tests passed (60 files). cf:build requires `opennextjs-cloudflare` (e.g. via root or apps/web dependency); see docs/operations/BUILD_AND_RELEASE.md.

---

## Env vars reference (Phase 4.1)

| Env | Default | Purpose |
|-----|---------|--------|
| **FCM_PROJECT_ID** | — | FCM HTTP v1: Firebase project ID. |
| **FCM_CLIENT_EMAIL** | — | FCM HTTP v1: service account email. |
| **FCM_PRIVATE_KEY** | — | FCM HTTP v1: PEM private key (`\n` normalized). |
| **FCM_TOKEN_URI** | https://oauth2.googleapis.com/token | FCM HTTP v1: OAuth2 token endpoint. |
| **FCM_SERVER_KEY** | — | Legacy FCM server key (fallback when v1 not set). |
| **MEDIA_FINALIZE_VERIFY_OBJECT** | false | When true, finalize checks object exists in storage; missing → 400 `media_object_missing`. |
| **MEDIA_FINALIZE_VERIFY_STRICT** | false | When verify on, storage errors block finalize with 503 if true. |
| **SYNC_MIN_RETAINED_CURSOR** | 0 | Min change_log id retained; client cursor below → 409 `retention_window_exceeded`. 0 = disabled. |

## Runbooks updated

- **PUSH_DELIVERY.md** — FCM HTTP v1 env, migration from legacy key.
- **MOBILE_UPLOADS.md** — Finalize verification flags.
- **MOBILE_SYNC.md** — SYNC_MIN_RETAINED_CURSOR, conflict hints (`retention_window_exceeded`, `device_mismatch`).

## How to verify (smoke)

- **Tests:** `cd apps/web && npm run test -- --run` → all pass.
- **Build:** `cd apps/web && npm run cf:build` (requires OpenNext/Cloudflare tooling).
- **Sync 409:** Call GET changes or POST ack with cursor below `SYNC_MIN_RETAINED_CURSOR` (when set) → 409 with `hint: retention_window_exceeded`. With cursor behind stored device cursor → 409 with `hint: device_mismatch`.
- **Finalize:** With `MEDIA_FINALIZE_VERIFY_OBJECT=true`, finalize with non-existent object_path → 400 `media_object_missing`.
- **FCM v1:** Set FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY; Android push uses HTTP v1 (no legacy key needed).
