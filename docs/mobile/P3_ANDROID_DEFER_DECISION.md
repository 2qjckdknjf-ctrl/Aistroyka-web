# P3 — Android defer decision (first-client Day-0)

**Date:** 2026-08-31  
**Status:** **DEFERRED BY DECISION** — authoritative for controlled first-client Day-0  
**Closes:** `docs/tz/00_OPEN_BLOCKERS.md` **P0-DOC-1**

---

## Decision

Android Manager and Android Worker are **not required** for the first real-client Day-0.

| Question | Answer |
|----------|--------|
| Android required for this pilot | **NO** |
| Launch blocked by Android absence | **NO** |
| Field contour | **iOS Worker** + **iOS Manager or web dashboard** |
| Android-only field workers | **NO-GO** unless the client accepts iPhone/TestFlight or an explicit web-only waiver |

## What this supersedes

`docs/launch/FIRST_CLIENT_SCOPE_LOCK.md` (2026-03-24) required Android + iOS in one week. That lock is **historical**. It does **not** govern Phase 12 Client Day-0.

Matching sources (keep these; do not revive the March mandate):

- `docs/launch/PILOT_DAY0_GO_NO_GO.md`
- `docs/reports/PHASE6_ANDROID_CURRENT_MAIN_CERTIFICATION_2026-08-22.md` §6
- `docs/launch/PILOT_INTAKE_CARD.md` §5 Android support default **NO**
- `AGENTS.md` — iOS primary; no preemptive Android product expansion

## What Android is today

Compose Manager + Worker exist on `main` and can build. That is **not** Day-0 product parity and is **not** a Google Play upload. Play remains `OWNER_ACTION_REQUIRED` (`APPROVE_GOOGLE_PLAY_UPLOAD`).

## Operator rule

If intake marks any worker **Android-only**, stop and get a written waiver or provide iPhones. Do not start an Android rescue as a hidden Day-0 track.
