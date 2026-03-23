# Phase 5 — Product completion layer (completion matrix)

**Date:** 2026-03-23  
**Tracks:** [AISAA-13](/AISAA/issues/AISAA-13)

## Method

Code and route inspection under `apps/web`, plus alignment with prior closure docs. **No claim** of production E2E for migration- or RLS-sensitive flows while [AISAA-11](/AISAA/issues/AISAA-11) is blocked.

Legend: **DONE (repo)** = implemented and wired in codebase; **PARTIAL** = usable but missing parity or narrative closure; **STUB / ENV** = returns 503 or noop without configuration; **OPEN** = not closed in repo or live.

---

## 1. Manager control center

| Capability | Status | Evidence / gap |
|------------|--------|----------------|
| Dashboard navigation + onboarding gate | **DONE (repo)** | `DashboardShell`, `OnboardingGate`, entry policy [ENTRY_ROUTING_POLICY.md](../architecture/ENTRY_ROUTING_POLICY.md) |
| Project detail as hub | **DONE (repo)** | Summary, attention, timeline, documents, issues, schedule panels |
| Cross-project portfolio command | **DONE (repo)** | `/portfolio` + `/api/v1/portfolio/summary` |
| Unified “approvals” mental model | **PARTIAL** | Reports queue ≠ project documents queue; see Phase 1D |
| Manager project document review (3 outcomes + note) | **PARTIAL** | Approve/reject only on manager panel; owner path has full triad |
| Notifications center | **DONE (repo)** | Routes + `NotificationBadge`; complements attention feed |

---

## 2. Customer / owner module

| Capability | Status | Evidence / gap |
|------------|--------|----------------|
| Dedicated owner route | **DONE (repo)** | `/dashboard/projects/[id]/owner` |
| Owner-scoped attention API | **DONE (repo)** | `requireProjectOwner` + `viewer=owner` |
| Document decisions (approve / reject / request_changes + comment) | **DONE (repo)** | `POST .../decision` + `OwnerViewClient` |
| Summary, timeline, issues, media, milestones, reports | **DONE (repo)** | `OwnerViewClient` fetches |
| Product doc alignment | **PARTIAL** | `OWNER_MODULE_MVP.md` predates **project owner role** migration; code is stricter — update doc or accept drift |
| “No billing on owner surface” | **DONE (repo)** | Consistent with MVP non-goals; billing remains tenant `/billing` |

---

## 3. Unified workflow narrative

| Theme | Status | Notes |
|-------|--------|-------|
| Single inbox for all reviewables | **OPEN** | Two concepts: report approvals page vs in-project documents |
| Clear copy / IA for managers | **PARTIAL** | Sidebar labels do not disambiguate “report approvals” vs “document review” |
| End-to-end story in one doc for sales/support | **OPEN** | This Phase 5 set + Phase 1D + Phase 4 together form the narrative; not yet a single user-facing doc |

---

## 4. Commercial / billing

| Capability | Status | Evidence / gap |
|------------|--------|----------------|
| Billing readiness / overview API | **DONE (repo)** | Honest flags without fake checkout |
| Stripe checkout session | **ENV** | Requires Stripe + admin client; otherwise **503** |
| Webhooks | **DONE (repo)** | Routes + tests in repo (`billing-routes.test.ts`, stripe webhook test) |
| Sandbox (no real money) | **DONE (repo)** | Explicit pilot/sandbox routes |
| Admin billing pilot pages | **DONE (repo)** | Under `admin/billing-pilot/` |
| Live “paid conversion” proof | **OPEN** | Not asserted here; depends on secrets, Stripe account, and healthy DB |

---

## 5. Verdict precursor

**Repo:** Manager and owner **vertical slices exist**; **workflow unification** and **manager–document parity** are **not complete**. **Billing** is **architecturally present** but **commercially proven** only when env and live gates pass.

**Live:** Treated as **OPEN** for strict closure until [AISAA-11](/AISAA/issues/AISAA-11) unblocks health/migrations (see [PHASE3_LIVE_POST_AUDIT.md](./PHASE3_LIVE_POST_AUDIT.md)).
