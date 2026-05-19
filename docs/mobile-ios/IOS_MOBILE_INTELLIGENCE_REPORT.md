# iOS — intelligence surfaces (Phase 7)

**Project:** AISTROYKA  
**Date:** 2026-05-19  
**Scope:** AiStroykaWorker + AiStroykaManager + minimal **web** API gates that affect mobile.

## Summary

“Intelligence” on mobile today means **activation checklist**, **server-driven help hints**, **help assistant** (summary + confidence + optional risk signals), and **Manager-only AI job lists** — not a free-form chat Copilot.

---

## AiStroyka Worker

| Surface | UI | API |
|--------|-----|-----|
| Get Started checklist + launch steps | `HomeView` · `workerStartGuidanceCard` | `GET /api/v1/activation/status` |
| Hint bullets (or fallbacks) | Same card | `POST /api/v1/help/hints` |
| Guide summary + confidence + risk signals | Same card | `POST /api/v1/help/assistant` |
| Analytics | Fire-and-forget | `POST /api/v1/help/assistant/events` (`type: open`, …) |

**Roles (see `AppRuntime`):** Help **hints** requests use launch role **`manager`** so checklist copy matches the server `LaunchRole` catalog the backend expects for worker builds; **assistant events** use role **`worker`** for honest analytics.

**Lite allow-list:** These paths were **missing** from `checkLiteAllowList` (only `/api/v1/worker/*` etc. were allowed), so **`ios_lite` / `android_lite` received 403** and the Worker UI fell back to empty `try?` loads. **Fixed** in Phase 7 by explicit allow rules for `activation/status` (GET) and `help/*` (POST only on `hints`, `assistant`, `assistant/events`).

---

## AiStroyka Manager

| Surface | UI | API |
|--------|-----|-----|
| Same checklist + hints + assistant + risks | `HomeDashboardView` | `GET /api/v1/activation/status`, `POST /api/v1/help/hints`, `POST /api/v1/help/assistant`, events |
| Tenant-wide AI analysis jobs | `AITabView` | `GET /api/v1/ai/requests` |
| Per-project AI rows | `ProjectDetailView` → `ProjectAIView` | `GET /api/v1/projects/:id/ai` |

**Client profile:** `ios_manager` — **not** subject to lite allow-list; full dashboard API surface.

**Dead / legacy:** `AICopilotPlaceholderView.swift` remains in the project but **`ManagerTabShell` uses `AITabView`**, not the placeholder (see `docs/ios-manager/AI_MODULE.md`).

---

## Product limits (honest)

- **No** interactive Q&A Copilot in-app; assistant is invoked with **empty query** on home load for a **short summary**, not a chat session.
- **Offline:** no local intelligence; failures are silent (`try?`) on Worker hints — consider surfacing error state in a later UX pass.
- **Locale:** `supportedHelpLocale()` maps device language to `ru` / `es` / `it` / default `en` for help payloads.

---

## Validation

| Check | Result |
|--------|--------|
| `vitest` `apps/web/lib/api/lite-allow-list.test.ts` | **PASS** |
| Device E2E: Worker card shows hints after login | **Phase 9** |

---

## Phase 7 closure

### A. PHASE STATUS

**CLOSED** — documentation + **lite allow-list fix** for Worker/field help routes.

### B. FILES TOUCHED (this pass)

- `apps/web/lib/api/lite-allow-list.ts`  
- `apps/web/lib/api/lite-allow-list.test.ts`  
- `docs/mobile-ios/IOS_MOBILE_INTELLIGENCE_REPORT.md` (this file)  
- `docs/mobile-ios/IOS_FINAL_MOBILE_READINESS_VERDICT.md`

### C. NEXT PHASE ALLOWED

**YES** — Phase 8 (documents / budget minimal) or Phase 9 (E2E validation).

---

*End of Phase 7 report.*
