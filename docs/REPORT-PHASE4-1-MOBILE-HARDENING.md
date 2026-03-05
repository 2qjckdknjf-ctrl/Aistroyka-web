# Phase 4.1 — Mobile Reliability Hardening to Production

**Project:** AISTROYKA.AI  
**Phase:** 4.1 — Mobile Reliability Hardening. No UI work. No product expansion.  
**Goal:** Improve correctness and ops safety for worker/sync/media/push.

**Non-negotiables:** No v1 API contract breaks; preserve Phase 1–4 outcomes; env-gated risk; tests per new rule; this report + updated runbooks.

---

## Stage 0 — Baseline Checkpoint

### 0.1 Working tree

- **Note:** Baseline recorded with uncommitted changes present. Recommend `git stash` or commit before applying Phase 4.1 changes for a clean history.

### 0.2 Report skeleton

- This document. Placeholders per stage below.

### 0.3 Baseline (tests + cf:build)

- **Vitest:** 269 tests, 58 files passed (apps/web: `npm test -- --run`).
- **cf:build:** OpenNext Cloudflare build succeeded (`npm run cf:build`). ESLint plugin conflict warning present; build not blocked.

---

## Stage 1 — FCM HTTP v1 (Service Account)

- **Summary:** _placeholder_
- **Env vars:** _placeholder_
- **Migration from legacy:** _placeholder_

---

## Stage 2 — Optional Storage Existence Check on Finalize

- **Summary:** _placeholder_
- **Env flags:** _placeholder_

---

## Stage 3 — Sync Conflict Detection Hardening

- **Summary:** _placeholder_
- **Retention + device mismatch:** _placeholder_

---

## Stage 4 — Build/CI Clarity

- **Canonical checks:** _placeholder_
- **BUILD_AND_RELEASE.md:** _placeholder_

---

## Stage 5 — Final Verification

- **Commands run:** _placeholder_
- **Smoke / how to verify:** _placeholder_

---

## Env vars reference (Phase 4.1)

| Variable | Stage | Default | Description |
|----------|-------|---------|-------------|
| _TBD_ | 1 | — | FCM HTTP v1 |
| _TBD_ | 2 | — | Finalize verification |

---

## Runbooks updated

- _PUSH_DELIVERY, MOBILE_UPLOADS, MOBILE_SYNC, BUILD_AND_RELEASE_
