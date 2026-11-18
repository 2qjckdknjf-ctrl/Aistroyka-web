# 05 — Roadmap & Backend Reconciliation

**Audit date:** 2026-08-09

**Source/runtime SHA:** `02baa6a` (match)

**Historical baseline (not rewritten):** [`docs/audit/AISTROYKA_FULL_PRODUCT_DESIGN_ARCHITECTURE_AUDIT_2026-08-02.md`](../AISTROYKA_FULL_PRODUCT_DESIGN_ARCHITECTURE_AUDIT_2026-08-02.md) — previously local/unpublished; published with this handoff for self-containment.

**Delivery roadmap:** [`docs/roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md`](../../roadmap/AISTROYKA_COMPLETION_DELIVERY_ROADMAP_2026-08-02.md) — same provenance (local/unpublished → published with handoff).

**Mega-roadmap finance rule:** customer must never see internal contractor finance — unchanged.

Claim labels: `VERIFIED` | `PARTIAL` | `STALE` | `CONTRADICTED` | `BLOCKED_EXTERNAL`

---

## 1. Runtime / release claims

| Claim | 2026-08-02 baseline | 2026-08-09 evidence | Label |
|-------|---------------------|---------------------|-------|
| Production healthy | `8408ca2` | `02baa6a`, ok/db | VERIFIED (new SHA) |
| Staging matches prod | yes at prior SHA | yes at `02baa6a` | VERIFIED |
| origin/main == deployed | drifted then | **match** | VERIFIED |
| Security headers singleton | pre-#214 risk | #214 merged; smoke PASS | VERIFIED |
| STATUS/truth index current | pointed R0.2/`8408ca2` | still stale locally (dirty) | STALE |
| R0.2 observation complete | T+24h PASS; window open | Calendar past T+72; **not closed by this audit** | STALE / unresolved governance |
| R0.3 / R1 / R2 / R3 closed | no | still open | VERIFIED open |

This audit does **not** change historical R0.* YES/NO gates.

---

## 2. Merged P0s relevant to UI

| PR | Topic | Product-design impact | Label |
|----|-------|----------------------|-------|
| #211 | AI pipeline recovery + dashboard states | AI UI must show honest non-LIVE / incomplete states — observed incomplete analysis copy | PARTIAL (UI states present; LIVE not proven) |
| #214 | Security header dedup | Not visual; precondition for safe public audit | VERIFIED |

---

## 3. Capability buckets

### Implemented and proven working (this run)

- Public home/features/contact locales; guest redirect; login/register surfaces
- Mobile header Cabinet CTA
- Staging cabinet: dashboard, projects, tasks, reports, approvals, uploads, support, notifications, tenant admin, admin AI
- Public mock AI/copilot labeled
- Security header smoke PASS

### Implemented but visually / UX incomplete

- Privacy/Terms placeholders (R1)
- Login debug “Login step: idle”
- Welcome modal + dense onboarding overlaying ops
- Project detail dual tab IA; Costs/Estimate adjacency
- Client portal shell/onboarding mismatch
- Bare Forbidden platform-admin page
- Wave C incomplete; `check:design` red

### Implemented but not safely reachable here

- Platform Admin Operations Center (owner session)
- iOS Manager screens
- iOS Worker authenticated field path
- Full approve/reject/CO respond mutations
- Task chat deep UI

### Backend exists, UI missing / misleading

- Password reset API capability may exist via Supabase email flows, but **no first-class reset UI route**
- SCIM API stub 501 — no UI (expected post-pilot)
- Orphan manager panels historically noted; live paths are dedicated routes (OK if nav discoverable)

### UI exists, backend/runtime not proven

- AI LIVE / provider success — keys configured; **no paid live proof this run**
- Push delivery — Devices & Sync UI present; live APNS/FCM not proven
- Client finance isolation on portal — not cleared by screenshot alone

### Truly not implemented / deferred

- SCIM product
- Android pilot parity
- Forgot-password page

### Historical claim contradicted / overstated

- Wave B “complete” overstated vs mobile raw colors / missing BrandTokens (`04_DESIGN_SYSTEM_DRIFT.md`)
- 2026-08-02 audit could not capture browser screens; **this audit supersedes visual gap** for public + staging cabinet on `02baa6a`

---

## 4. Roadmap stage mapping (honest)

| Roadmap item | Status from evidence |
|--------------|----------------------|
| R0 release truth | Runtime truth is `02baa6a`; local STATUS pointers STALE |
| R1 legal + semantic localization | Legal **PARTIAL**; key i18n scope PASS; semantic quality not certified |
| R2 web reliability | Outside visual scope; not closed here |
| R3 Design Wave C pilot surfaces | **Not started as closed stage**; Wave C in progress with concrete P1 UI issues |
| R4 live AI/push/billing | BLOCKED_EXTERNAL / not certified |
| R5 iOS device + TestFlight | BLOCKED_EXTERNAL for this audit’s Manager/auth Worker captures |
| Phase 9 Day 0 | NO — unchanged |

---

## 5. Open draft PRs (do not treat as shipped)

Security/product drafts #213–#189 etc. may change portal/RBAC/report/upload behavior after merge. Audited behavior is **current main/runtime only**.

---

## 6. Customer-finance boundary

- Contractor project detail exposes **Costs** and **Estimate** tabs — appropriate for contractor ops if RBAC holds.
- Client portal capture did **not** show cost/margin tables in viewport; however client view still used contractor shell — **PARTIAL / needs dedicated client-role proof**, not a finance-safe clearance.
- Mega-roadmap rule remains binding for any **Product Design Remediation Slice 01+** work.
