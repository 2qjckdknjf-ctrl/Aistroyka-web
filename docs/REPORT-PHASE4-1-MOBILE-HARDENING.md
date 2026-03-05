# Phase 4.1 — Mobile Reliability Hardening to Production

**Project:** AISTROYKA.AI  
**Phase:** 4.1 — Mobile Reliability Hardening (no UI, no product expansion).  
**Status:** In progress.

**Non-negotiables:** No v1 API contract breaks (worker/sync/media/devices); preserve Phase 1–4; env-gated risk; tests per change; runbooks + this report.

---

## Stage 0 — Baseline checkpoint

- **0.1 Working tree:** Not clean (branch has other changes); report and Phase 4.1 work proceed on current branch.
- **0.2 Report skeleton:** Created.
- **0.3 Baseline:** Vitest 269 tests passed (58 files). cf:build: `opennextjs-cloudflare` CLI not installed (npm script invokes it; package not in package.json); documented in Stage 4.

---

## Stage 1 — FCM HTTP v1 (service account)

- **Goal:** Replace legacy FCM_SERVER_KEY with FCM HTTP v1 auth.
- **Env vars:** (placeholder)
- **Migration:** (placeholder)
- **Tests:** (placeholder)

---

## Stage 2 — Optional storage existence check on finalize

- **Goal:** Env-gated verification that object exists before finalize.
- **Flags:** (placeholder)
- **Tests:** (placeholder)

---

## Stage 3 — Sync conflict detection hardening

- **Goal:** Retention boundary + device mismatch → 409 with stable contract.
- **Tests:** (placeholder)

---

## Stage 4 — Build/CI clarity

- **Canonical checks:** (placeholder)
- **Docs:** (placeholder)

---

## Stage 5 — Final verification

- **Commands run:** (placeholder)
- **Summary:** (placeholder)

---

## Env vars reference (Phase 4.1)

(To be filled in Stage 5.)

## Runbooks updated

(To be filled in Stage 5.)
