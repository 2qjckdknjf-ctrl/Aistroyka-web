# PHASE 1 — Release 1 exclusions (frozen)

Everything listed here is **OUT OF R1 — FROZEN** for functional work **unless** a **P0 blocker** is filed with evidence that a **canonical flow** in `PHASE1_FINAL_SCOPE.md` §D cannot complete without touching it.

Legend:

- **PRESERVE** — future foundation; do not delete or merge away.  
- **RISKY** — high blast radius if refactored.  
- **DEEP** — exceeds R1 depth.  
- **NOT REQUIRED** — not needed for F1–F10.

---

## 1. Entire nested products

| Item | Path | Why excluded | Category |
|------|------|--------------|----------|
| Paperclip | `paperclip/**` | Separate workspace(s) / product | NOT REQUIRED + PRESERVE |

---

## 2. AI — broad experimentation (excluded)

| Item | Path | Why excluded | Category |
|------|------|--------------|----------|
| AI Brain multi-phase library | `apps/web/lib/ai-brain/phase-a` through `phase-e` (and adjacent) | Broad experimentation; tests exist but **scope** is not R1 operating truth | DEEP + RISKY |
| Many `/api/v1/ai/*` routes | e.g. `evals`, `optimizations/experiments`, `memory/*` if used only for research | **Excluded** unless a **named allow list** in R1 implementation plan ties a **single** endpoint to **report summary / digest / client draft** | DEEP |

**IN R1 AI allow (narrow — implementation wave will name exact routes):**

- Endpoints that **only** summarize existing **report/project/task** entities using current DB state.  
- **No** new agent runtimes, **no** optimization experiments, **no** broad memory layer consumption.

---

## 3. Billing / Stripe (excluded except earnings-light read path)

| Item | Path | Why excluded | Category |
|------|------|--------------|----------|
| Billing pilot cohort admin | `apps/web/app/api/v1/admin/billing/**`, `admin/billing-pilot/page.tsx`, `lib/platform/billing-readiness/**` pilot-specific | Pilot **expansion** not R1 | DEEP + RISKY |
| Checkout / portal productization | `v1/billing/checkout-session`, `portal`, sandbox flows | Heavy rollout | NOT REQUIRED |
| Stripe **webhook ingress** | `apps/web/app/api/v1/billing/webhooks/stripe/route.ts` | **PRESERVE / DO NOT TOUCH UNLESS BLOCKER** — financial side effects | RISKY |

**Earnings light** (in R1) must prefer **read models** built on **existing** domain (reports approved, task progress, worker summary APIs) — **not** new billing products.

---

## 4. Plan-fit / onboarding depth (excluded as expansion)

| Item | Path | Why excluded | Category |
|------|------|--------------|----------|
| Plan-fit orchestration surface | `v1/plan-fit/**`, `components/onboarding/plan-fit/**` | Onboarding depth; **only** preserve if blocking login/tenant | DEEP |

**R1 rule:** Use **minimal** path to operational truth; do **not** expand plan-fit rulesets.

---

## 5. Enterprise / compliance modules (excluded)

| Item | Examples in repo | Category |
|------|------------------|----------|
| SCIM | `app/api/v1/scim/[...path]/route.ts` | NOT REQUIRED |
| Privacy export batches | migrations + admin privacy routes | NOT REQUIRED |
| SLO enterprise dashboards | `v1/admin/slo/**` | NOT REQUIRED |

---

## 6. Media / collaboration depth (excluded)

| Item | Path | Why excluded | Category |
|------|------|--------------|----------|
| Photo collab / annotations depth | `v1/media/[mediaId]/annotations/**`, `collab` | NOT REQUIRED for canonical worker proof contour | DEEP |

**Preserve** APIs; do **not** expand.

---

## 7. Mobile debug / pilot-only behavior (must not define R1 “done”)

| Item | Path | Why excluded from **proof** | Category |
|------|------|--------------|----------|
| Submit without photo (debug) | `android/AiStroykaWorker/build.gradle.kts` `BuildConfig.PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO`, `WorkerApp.kt` | **Proof** must use **release rules** or `-PpilotRealSubmit=true` | RISKY (misleading if used as success) |

---

## 8. Optional packages (not R1 dependencies)

| Item | Path | Category |
|------|------|----------|
| Standalone API SDK | `packages/api-client/` — `package.json` states not used by web at runtime | NOT REQUIRED |

---

## 9. Documentation / audit archive

| Item | Path | Category |
|------|------|----------|
| Historical docs | `docs/**` outside `docs/release1/` | PRESERVE — do not mass-delete |

---

## 10. Contradiction handling

| Old doc | Repo truth | R1 action |
|---------|------------|-----------|
| `FIRST_CLIENT_SCOPE_LOCK.md` Android photos = **None** | `WorkerApi`, `WorkerViewModel` implement upload/report | **Exclude** stale row from planning; trust repo |
| Phase 0 “no iOS xcodeproj” | `AiStroykaWorker.xcodeproj`, `AiStroykaManager.xcodeproj` exist | **Exclude** false blocker; **keep** CI reproducibility gate |
