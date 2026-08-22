# AISTROYKA Current Project Truth Index

**Last updated:** 2026-08-21 (100% Readiness Phase 0 truth reset)
**Canonical launch roadmap:** `docs/roadmaps/AISTROYKA_100_PERCENT_READINESS_2026-08-21.md`
**Truth snapshot:** `docs/status/AISTROYKA_CURRENT_TRUTH.md`
**Execution log:** `docs/reports/AISTROYKA_100_PERCENT_EXECUTION_LOG.md`

## 1. Purpose

This document is the **current project truth index** for AISTROYKA.

Historical docs under `docs/` may contain older readiness, certification, GO/NO-GO, or "production ready" claims. Those documents are **evidence snapshots** unless explicitly revalidated here.

**If a historical doc conflicts with this index, this index wins** unless newer dated evidence (SHA, PR, CI, deployment, smoke, governance) supersedes it.

## 2. Current main (2026-08-21)

| Field | Value |
|-------|-------|
| **origin/main** | `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`) |
| **date** | 2026-08-21 |
| **repo** | `2qjckdknjf-ctrl/Aistroyka-web` |
| **Production buildStamp** | `a714424` — **MATCH** origin/main |
| **Staging buildStamp** | `a714424` — **MATCH** origin/main |
| **Classification** | `production-capable / controlled-pilot candidate` — not Public GA |
| **Active program** | 100% Launch Readiness Phases 0–15 |

### Latest merged slices (on main)

| PR | Topic |
|----|-------|
| #227 | Post-unify audit — AI Copilot + chrome bugs |
| #226 | Unify web + iOS + Android to Memory OS canon v4 |
| #225 | iOS WorkerSemanticColors compile fix |
| #224 | Canon audit remediation web + iOS + Android |
| #223 | Canonical Liquid Glass redesign slices 01–24 |
| #217 | Product Design Remediation Slice 01 |
| #215 | Product design audit handoff docs |
| #214 | P0 security header dedup |
| #211 | P0 AI pipeline recovery |

## 3. What is verified (2026-08-21)

- **Runtime ↔ source MATCH:** `GET /api/v1/health` on apex and staging returns `buildStamp.sha7=a714424` matching `origin/main` tip.
- **DB reachable:** `db=ok`, `supabaseReachable=true` on production health.
- **AI configured (not LIVE-certified):** `aiConfigured=true`, `openaiConfigured=true` — LIVE gate deferred to Phase 7.
- **Deploy platform:** Cloudflare Workers (OpenNext) via GitHub CI staging→production chain.
- **Branch protection:** `enforce_admins=true`; 1 required approving review on `main`.
- **Customer-finance policy:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` remains **CURRENT**.

## 4. What is NOT verified

- **Public GA readiness** — program Phases 0–15 not closed.
- **AI LIVE** — `scripts/smoke/ai_live_provider.sh --require-live` not run in this execution.
- **Migration parity** — remote-only migrations `021_saved_places`, `022_protected_day_events` not in repo; Phase 3 gate.
- **iOS TestFlight / Google Play** — store distribution not certified; issues #158–#160 open.
- **Full persona E2E** — Phase 9 not started.
- **Legal final approval** — Privacy/Terms may be integration-ready only; owner legal signoff = external.
- **30 open security PRs** — not merged; do not assume fixes are in production until merged.

## 5. Document classification

| Document / area | Status |
|-----------------|--------|
| `docs/roadmaps/AISTROYKA_100_PERCENT_READINESS_2026-08-21.md` | **CURRENT** — launch sequencing |
| `docs/status/AISTROYKA_CURRENT_TRUTH.md` | **CURRENT** — snapshot |
| `docs/reports/AISTROYKA_100_PERCENT_EXECUTION_LOG.md` | **CURRENT** — execution evidence |
| `STATUS.md` | **CURRENT** |
| This index | **CURRENT** |
| `docs/roadmap/AISTROYKA_100_PERCENT_COMPLETION_PLAN.md` | **HISTORICAL** — prior phase map reference |
| `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` | **CURRENT** — product policy |
| `docs/reconciliation/release-truth-2026-08-02/` | **HISTORICAL** |
| `docs/roadmap/AISTROYKA_PHASE8_*` | **HISTORICAL** |
| `docs/audit/product-design-current-main-2026-08-09/` | **HISTORICAL** — pre-#223 redesign evidence |
| `docs/audit/mobile-store-readiness-2026-08-21/` | **CURRENT** — verify against `a714424` |
| Gold Memory / Expert Review / AI Flywheel | **DEFERRED** post-pilot |

## 6. Open PRs / issues (launch-relevant)

| Item | Notes |
|------|-------|
| 30 open PRs | Mostly `cursor/critical-bug-investigation-*` security; #221 design remediation |
| #111 | AI/Flywheel — deferred post-baseline |
| #158 | iOS distribution preflight |
| #159 | Android distribution preflight |
| #160 | Mobile pilot distribution decision |

## 7. External blockers

| Blocker | Phase |
|---------|-------|
| Sasha Memory OS MCP | M0 — `MEMORY_WRITE_EXTERNAL_BLOCKER` |
| TestFlight credentials | Phase 5 |
| Play Console credentials | Phase 6 |
| Legal owner approval | Phase 2 |

---

*Refresh after each phase closure or any deploy that changes `buildStamp`.*
