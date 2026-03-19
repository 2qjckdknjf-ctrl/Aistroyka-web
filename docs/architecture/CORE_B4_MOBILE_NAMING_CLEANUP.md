# B4 — Mobile naming cleanup — Aistroyka

**Date:** 2026-03-16

---

## Current canonical mobile names

| Role | Canonical name | Typical display |
|------|----------------|-----------------|
| Field worker app | **AiStroykaWorker** | AiStroyka Worker |
| Manager app | **AiStroykaManager** | AiStroyka Manager |
| Shared Swift | **ios/Shared** | — |
| Android | **android/AiStroykaWorker**, **android/AiStroykaManager** | — |

---

## Legacy names found

- **WorkerLite / Worker Lite** — archive docs, `docs/worker-lite/`, `IOS_RENAME_PRECHECK.md`, `IOS_BUILD_WARNINGS_FIX_REPORT.md` (tree no longer in repo).  
- **ManagerLite** — not used as a live product name in current paths.

---

## Changes made (this B4 pass)

- **SAFE:** `docs/release-audit/03_FEATURE_READINESS_MATRIX.md` — Manager row evidence points to **AiStroykaManager**; worker row renamed to **Worker app (iOS/Android)** with **AiStroykaWorker** as canonical, legacy WorkerLite called out only in remediation.  
- **SAFE:** `docs/IOS_BUILD_WARNINGS_FIX_REPORT.md` — top **Legacy** banner: targets removed WorkerLite tree; canonical app **AiStroykaWorker**.  
- **No Swift/Kotlin/bundle ID renames** — runtime risk deferred.

---

## Technical leftovers intentionally retained

- Historical strings in `docs/worker-lite/` and phase-7 reports.  
- Any **POTA.WorkerLite** mentions where documenting past bundle IDs.

---

## Summary

Canonical mobile names are **AiStroykaWorker** and **AiStroykaManager**. WorkerLite is **legacy / archival** only.
