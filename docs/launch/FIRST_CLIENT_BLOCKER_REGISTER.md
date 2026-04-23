# First-client blocker register (STAGE 0)

**Date:** 2026-03-24  
**Classification:** P0 = launch-blocking for stated program | P1 = high risk / must fix before pilot sign-off | P2 = acceptable with documentation or post-launch

---

## P0 — Launch-blocking

| ID | Blocker | Evidence | Notes |
|----|---------|----------|--------|
| P0-1 | **Android Worker is not a product** — no auth, no API client, no report/media/sync flows | `WorkerApp.kt` is a single `Text` composable; only shared code is `Config.kt` default URL | Entire STAGE 1 dedicated to rescue |
| P0-2 | **Android Manager is not a product** — same stub level | `ManagerApp.kt` centered label only | STAGE 2 |
| P0-3 | **Cross-platform launch claim is false** until P0-1 and P0-2 are resolved | Matrix shows iOS functional vs Android missing | Drives week plan: Android is critical path |

---

## P1 — High risk / must close before confident pilot

| ID | Item | Evidence | Suggested owner stage |
|----|------|----------|------------------------|
| P1-1 | **Worker video** not implemented on iOS; Android absent | No video in iOS Worker Swift; `UploadManager` is JPEG-only | STAGE 1–2 mobile + contract check |
| P1-2 | **Worker text comment** — no clear domain field + no iOS UI | `Report` type / `createReport` — no worker comment body | STAGE 3 or explicit product waiver |
| P1-3 | **No automated mobile CI** (build/test) | `docs/final/PHASE6_MOBILE_INVENTORY.md` §5 | STAGE 4–5 or parallel track |
| P1-4 | **Review status vocabulary** (`rejected` vs `reviewed`) must be consistent across iOS Manager UI, API, web | Migration `20260307300000_report_reject_semantics.sql`; iOS buttons use “Mark reviewed” | STAGE 3 hardening |
| P1-5 | **Production E2E not re-proven in this artifact** for full contour | PHASE6 notes AISAA-11 / tenant API caveats | STAGE 4 pilot validation |

---

## P2 — Non-blocking / document and schedule

| ID | Item | Evidence |
|----|------|----------|
| P2-1 | iOS Worker `x-client: ios_lite` header — legacy name | `APIClient` comment; not a functional blocker if server accepts |
| P2-2 | Some Manager tabs may be thin vs web (portfolio, deep enterprise) | Out of scope for this program unless pulled in explicitly |
| P2-3 | No XCTest/Android instrumented tests in repo | PHASE6 §6 |

---

## Register rules

1. **P0 must be empty or explicitly waived by stakeholder** before declaring first-client GO.  
2. **P1** should be driven to closure or written acceptance during STAGE 3–4.  
3. **P2** tracked in known limitations (STAGE 5).

---

## STAGE 0 decision

| Question | Answer |
|----------|--------|
| Can STAGE 1 (Android Worker rescue) start? | **YES** — scope and blockers are now explicit; no conflicting “defer Android” assumption. |
| Is any P0 cleared by documentation alone? | **NO** — P0 items require implementation. |
