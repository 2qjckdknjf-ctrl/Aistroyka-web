# CROSS-PLATFORM FLOW PROOF

**Audit date:** 2026-04-02  
Each flow lists **proof status**, **code anchors**, and **gaps**. Status: **PROVEN** only where both code path and **runtime evidence** exist in this audit or cited staged docs.

---

## FLOW 1 — Auth + role + tenant truth

| Step | Web | iOS Worker | iOS Manager | Android Worker | Android Manager |
|------|-----|------------|-------------|----------------|-----------------|
| Public entry → login | Middleware protects `/dashboard`, `/projects`, `/billing`, `/admin`, `/portfolio` (`middleware.ts`) | App login views → Supabase token in Keychain (`APIClient` token provider) | Same pattern, `ios_manager` profile | Session store + Supabase | Same |
| Token/session | `updateSession` + Supabase SSR | Bearer header | Bearer | Bearer | Bearer |
| Tenant resolution | `getTenantContextFromRequest` in API routes | Same API handlers | Same | Same | Same |
| Role gating | `tenant-role.server`, authz services, stakeholder paths | Server returns 403/404 on misuse | Manager routes | Lite allow list + handlers | Manager routes |

**Code:** `apps/web/middleware.ts`, `apps/web/lib/tenant/tenant.context.ts`, `apps/web/lib/supabase/server.ts`, `ios/Shared/Sources/Shared/APIClient.swift`, `android/shared/.../ApiClient.kt`  
**Runtime proof:** **PARTIAL** — web build + tests; mobile **not** re-run in this session. Prior notes: JWT without tenant membership → **403** on tenant APIs.  
**Status:** **PARTIAL**  
**Breakpoints:** Tenant invite/onboarding; smoke user must be tenant member for “green” metrics.

---

## FLOW 2 — Worker operational (create → upload → finalize → attach → submit → manager visibility)

| Step | Evidence | Status |
|------|----------|--------|
| Login | Worker apps use Supabase JWT + v1 routes | PARTIAL |
| Task/project context | `GET worker/tasks/today`, `GET tasks/:id` | Code PROVEN; live PROVEN Android per STAGE4 doc |
| Create report | `POST /api/v1/worker/report/create` | Code PROVEN |
| Upload session | `POST media/upload-sessions`, finalize | Code + unit tests PROVEN; iOS path fix noted in STAGE4 |
| Add media to report | `POST worker/report/add-media` | Code PROVEN |
| Submit | `POST worker/report/submit` | Code PROVEN; STAGE4 Android UUID **`114392b8-688c-464c-9015-ece795be59fa`** |
| Manager sees report | `GET /api/v1/reports/:id`, dashboard | STAGE4: approve path **PASS** same UUID |

**Data persistence:** Supabase tables via domain services (reports, worker_report_media, upload sessions).  
**Surfaces:** Web dashboard, iOS/Android Manager.  
**Status:** **PARTIAL** — **Android** contour evidenced in **STAGE4** docs; **iOS** E2E **not** evidenced there.

---

## FLOW 3 — Manager operational (review)

| Step | Evidence | Status |
|------|----------|--------|
| Manager login | Web + Manager apps | PARTIAL |
| Open project/task/report | ManagerAPI / dashboard | Code PROVEN |
| Review action | `PATCH /api/v1/reports/[id]` with status | Code + tests PROVEN |
| Server truth | `report.service` / repository | Tests PROVEN |
| Other surfaces | List/detail refresh | PARTIAL live |

**Status:** **PARTIAL**

---

## FLOW 4 — Notifications

| Step | Evidence | Status |
|------|----------|--------|
| Event → stored | Job handlers / domain notifications | Tests PROVEN (`manager-notifications.repository.test.ts`) |
| Unread/list | `GET /api/v1/notifications` | Route + repo PROVEN |
| Mark read | `PATCH .../notifications/[id]/read` | PROVEN in code |
| Cross-surface | Manager mobile + web consume same API | **UNKNOWN** live |

**Status:** **PARTIAL**

---

## FLOW 5 — AI / media / jobs

| Step | Evidence | Status |
|------|----------|--------|
| Media uploaded | Upload finalize routes | Tests PROVEN |
| Job enqueued | `lib/platform/jobs`, cron-tick | Tests PROVEN |
| Analysis stored / surfaced | Project AI, copilot stream, report analysis-status | Code PROVEN; **prod health** `aiConfigured: false` at check time |
| Failure visible | UI error paths, telemetry | PARTIAL |

**Status:** **PARTIAL** — **runtime AI configuration** ambiguous vs marketing.

---

## FLOW 6 — Client / owner truth

| Finding | Evidence |
|---------|----------|
| **No separate native client app** | Only web routes under `client/*` and APIs `client-view`, `client-portal`, stakeholder |
| **Web-only client experience** | **PROVEN** by route inventory |

**Status:** **DONE** (scope: web stakeholder surfaces exist; **not** a mobile client product).

---

## FLOW 7 — Release truth

| Check | Evidence | Status |
|-------|----------|--------|
| Buildability | `npm run build` **OK** this audit | DONE |
| Contracts | Part of build | DONE |
| Unit/integration tests | `npm test` **1245** passed | DONE |
| iOS build | Not executed here | UNKNOWN |
| Android build | Not executed here | UNKNOWN |
| Env | `docs/ENVIRONMENT-VARIABLES.md`, `.env.example` | ACTIVE (reference) |
| Push readiness | Device register routes exist; prod push not proven | PARTIAL |
| Cron | `cron-tick` route tests | PARTIAL |
| Smoke | `scripts/smoke/pilot_launch.sh` referenced in STAGE4 | PARTIAL |
| Store submission | Not audited | UNKNOWN |

**Overall flow status:** **PARTIAL**

---

## Consolidated verdict on E2E proof

- **Strongest runtime trail:** **STAGE4** documentation for **Android** Worker+Manager Maestro **with report UUID** (`docs/launch/STAGE4_CROSS_PLATFORM_TRUTH_MATRIX.md`).
- **Weakest:** **iOS** full contour **explicitly open** in same doc.
- **This audit session** did **not** rerun Maestro or device pilots.
