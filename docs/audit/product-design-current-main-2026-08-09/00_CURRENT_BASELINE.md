# 00 — Current Baseline (Product Design Audit)

**Audit UTC start:** `2026-08-09T09:20:48Z`  
**Europe/Madrid:** `2026-08-09T11:20:48+0200`  
**Mode:** `READ_ONLY_AUDIT_ONLY`  
**Verdict gate:** may proceed — production healthy, SHA provenance unambiguous

---

## 1. Workspace layers (do not collapse)

| Layer | Value | Notes |
|-------|-------|-------|
| Primary dirty branch | `release/phase8-ops-2026-08-02` | Unchanged by this audit |
| Primary dirty HEAD | `b25dc97d01fff123655d2add204386549709e829` | 32 dirty/untracked paths preserved |
| `origin/main` (fetched) | `02baa6a379ca9ff30735d35e53aea5198e972d45` | Tip = PR #214 merge |
| Audit source worktree | `/Users/alex/Projects/AISTROYKA-product-design-audit-2026-08-09` | Detached `origin/main`, clean |
| `AISTROYKA-main-clean` | `366f5a82…` on `ci/security-headers-live-smoke` | **Not** used — not at current `origin/main` |
| Deployed apex | `buildStamp.sha7=02baa6a`, `buildTime=2026-08-09 08:59` | HTTP 200, `ok=true`, `db=ok`, `env=production` |
| Deployed www | same as apex | HTTP 200 |
| Deployed staging | `buildStamp.sha7=02baa6a`, `buildTime=2026-08-09 08:55` | HTTP 200, `env=staging` |
| Runtime ↔ source match | **YES** | `origin/main` sha7 `02baa6a` == apex/www/staging |

Health JSON fields present: `ok`, `db`, `aiConfigured`, `openaiConfigured`, `supabaseReachable`, `serviceRoleConfigured`, `env`, `buildStamp.{sha7,buildTime}`.  
Not present on this runtime response: full `buildStamp.sha`, `releaseStamp`, explicit `aiOperationalClaim`, `rateLimitRpcStatus`.  
AI operational claim for audit labeling: treat as **configured / not LIVE** (keys present; no LIVE proof performed; no paid AI calls in this audit).

---

## 2. PR #214 (security-header hotfix) — verified

| Field | Evidence |
|-------|----------|
| State | **MERGED** |
| Merged at | `2026-08-09T08:55:21Z` |
| Merge SHA | `02baa6a379ca9ff30735d35e53aea5198e972d45` |
| Title | `fix(security): P0 production security header dedup (post #211)` |
| CI Check | SUCCESS |
| Staging deploy | SUCCESS — run `31304670104`, headSha `02baa6a…` |
| Production deploy | SUCCESS — run `31304813701`, headSha `02baa6a…` |
| Live header smoke (this run) | **PASS** on `https://aistroyka.ai` — singleton page/API headers, no joined duplicates |

Touched areas: middleware header ownership, security-headers JS/TS, smoke script, ownership/regression tests, security docs. Not a Product Design change.

---

## 3. Operational tails (not Product Design defects)

| Item | Status |
|------|--------|
| Legacy `/api/health` CSP | Still emits one document CSP via catch-all headers config (singleton value observed). Separate ops tail. |
| Duplicate-header incident | Closed by #214; not reopened — current smoke PASS. |
| STATUS / truth index | Still point at June/R0.2 T+24h (`8408ca2` / `d4589b94`). **Stale vs runtime.** Reconciled here for audit; surgical pointer update attempted only if safe. |
| R0.2 / R0.3 / R1 / R2 / R3 | Remain unresolved governance tracks. This audit does **not** close them. |

---

## 4. Open draft PRs affecting audited behavior (inventory only)

Draft security/product fixes — **not shipped**, not audited as product:

| PR | Title (summary) | Affected flow (claim only) |
|----|-----------------|----------------------------|
| #213 | Block viewer PostgREST writes on worker/project ops | Worker/project writes RBAC |
| #212 | Block viewer project deletes / forged estimate approvals | Project delete / estimate approval |
| #210 | Block change-order worker writes / proof-token leaks | Change orders / proof share |
| #209 | Membership privilege escalation / Stripe ingress | Membership / billing ingress |
| #208 | Paid Stripe entitlements / offline uploads | Billing + offline upload |
| #206 | Stakeholder media/AI RLS writes | Portal media / AI |
| #205 | Portal decision-maker responds / offline uploads | Portal decisions |
| #203 | Viewer change-order approve / decision-maker writes | Portal CO approve |
| #202 | Stripe webhook write loss on retry | Billing webhooks |
| #201 | Report photo URLs / false submit success | Reports media |
| #200 | Anonymous AI analyze / cross-tenant jobs | AI analyze |
| #199 | Worker changes_requested feedback / sync bootstrap | Worker resubmit / sync |
| #197 | Stripe cancel access / fake report photo proof | Billing + reports |
| #196 | Upload session rewrite / billing-media leaks | Uploads / billing |
| #195 | Staging cron job auth fail-closed | Cron auth |
| #194–#189 | Task chat media/auth/assignment | Task chat |

Non-draft open (not treated as shipped): #181 pilot manager workflow, #178 Russian docs, #106/#104/#103 AI flywheel, #119 invite membership.

---

## 5. Merged AI recovery relevant to UI truth

| PR | SHA | Note |
|----|-----|------|
| #211 | `87e0c437…` | P0 AI pipeline recovery — media resolve, provider retry, dashboard states. Merged before #214. UI must not claim LIVE without runtime proof. |

---

## 6. Roadmap / governance claims still open (audit-local)

Do **not** rewrite historical YES/NO gates. For this audit:

- Phase 8 / R0.2 observation window claims in STATUS are **time-stale** relative to 2026-08-09; runtime has moved to `02baa6a`.
- R0.3 source convergence, R1 legal/semantic localization, R2/R3 remain **unresolved**.
- Wave C design migration remains **in progress** per prior design docs — to be re-scored against current screens.
- Legal privacy/terms placeholders, Android deferral, store upload owner gates remain open product/ops items.

---

## 7. Capture targets for this audit

| Target | Use |
|--------|-----|
| Production `https://aistroyka.ai` | Public + guest-safe flows; SHA `02baa6a` |
| Staging `https://staging.aistroyka.ai` | Authenticated synthetic flows **only if** authorized credentials exist |
| Local current-main worktree | Code inventory; local server only if needed for auth |
| iOS Simulator | Manager/Worker UI if Xcode/simulator available |
| Android | Code/design inventory only (deferred) |

---

## 8. Proceed decision

| Check | Result |
|-------|--------|
| Production healthy | YES |
| Staging healthy | YES |
| SHA provenance clear | YES — main = apex = www = staging = `02baa6a` |
| Primary dirty tree preserved | YES |
| Clean source for code inspection | YES — dedicated worktree |
| External mutations authorized | **NO** — audit only |

**Audit may proceed as `READ_ONLY_AUDIT_ONLY`.**  
**Not** `PRODUCT_DESIGN_AUDIT_BLOCKED`.
