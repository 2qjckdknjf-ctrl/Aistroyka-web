# 07 — Final Product Design Audit (current main)

**Date:** 2026-08-09

**Mode:** READ_ONLY_AUDIT_ONLY

**Verdict:** `PRODUCT_DESIGN_AUDIT_PARTIAL_BLOCKED_EXTERNAL`

---

## 1. Baseline SHAs and runtime match

| Layer | Value |
|-------|-------|
| Dirty primary HEAD | `b25dc97d…` on `release/phase8-ops-2026-08-02` (preserved) |
| `origin/main` | `02baa6a379ca9ff30735d35e53aea5198e972d45` |
| Apex / www | `buildStamp.sha7=02baa6a` · `ok=true` · `db=ok` · production |
| Staging | `buildStamp.sha7=02baa6a` · staging |
| Runtime ↔ source | **MATCH** |
| PR #214 | MERGED `2026-08-09T08:55:21Z`; staging+prod deploy SUCCESS; header smoke PASS |
| Legacy `/api/health` CSP | Separate ops tail (singleton CSP) — not a visual defect |
| Audit worktree | `/Users/alex/Projects/AISTROYKA-product-design-audit-2026-08-09` @ `02baa6a` |

Details: `00_CURRENT_BASELINE.md`.

---

## 2. Audit scope and evidence limits

**In scope:** public production journeys; staging synthetic cabinet/portal/admin-AI; iOS Worker onboarding screenshot; design-system/code drift; bounded DOM/keyboard samples; roadmap reconciliation.

**Out of scope / not done by the audit agent:** application-code changes, manual production promotion, migrations, fixtures, paid AI, push send, store upload, Figma, DesignPreview-as-proof, rewriting the 2026-08-02 historical audit body.

**Deployment wording (precise):** this audit did **not** manually promote production or ship application code. Publishing the docs Draft PR may still run repository CI (lint/tests/`cf:build` Cloudflare bundle) and automatic preview deployments (e.g. Vercel Preview). Merge to `main` may trigger established staging/production Worker automation — that is existing repo CI, not a manual Product Design production deploy.

**Limits:** no screen-reader certification; no WCAG claim; client finance isolation not DOM-proven; Operations Center and iOS Manager not captured; Worker authenticated path blocked.

---

## 3. Applications / roles / flows covered

| Group | Coverage |
|-------|----------|
| A Public + auth | Fully captured (except password reset — missing) |
| B Tenant cabinet | Partially captured (lists/detail; mutations blocked) |
| C Portal | Partially captured |
| D Admin / platform | Tenant admin captured; platform Forbidden only |
| E AI | Mock + dashboard AI list; no LIVE calls |
| F iOS Worker | Onboarding only |
| G iOS Manager | Blocked |
| Android | Deferred inventory |

---

## 4. Overall product-design verdict

AISTROYKA on `02baa6a` presents a **cohesive public brand shell** and a **real multi-module operations cabinet** on the matching staging runtime. Pilot-critical visual blockers are concentrated in **legal placeholders**, **auth polish**, **first-run modal / IA density**, and **client-shell confusion** — not in “marketing is fake” or “cabinet missing.”

Design stage remains **Wave C in progress**. Not GA. Not Day-0 GO.

---

## 5. Strengths

1. Brand-first public hero across EN/RU/ES/IT; no mock production-scale metrics.
2. Mobile **Кабинет** CTA visible without burger-only reliance.
3. Guest fail-closed redirects to localized login.
4. Staging build stamp proves audited cabinet = deployed SHA.
5. Public AI demos labeled mock; incomplete AI analysis messaging present (honest direction).
6. Focus rings visible in keyboard sample on public pages.
7. iOS Worker onboarding copy matches product family (dark + yellow).

---

## 6. Numbered flow steps

See `02_FLOW_STEP_AUDIT.md` (linked screenshots). Summary counts below in §13.

---

## 7. P0 / P1 findings

**P0 proven this run:** none (no demonstrated customer-finance leak, destructive error, or deceptive LIVE/payment claim on accepted screenshots).

**P1 (evidence-backed):**

1. **PD-P1-01** — Login debug “Login step: idle” (`02_login_*`).
2. **PD-P1-02** — Privacy/Terms placeholders (`06_*`, `07_*`, `13_*`).
3. **PD-P1-03** — Welcome modal blocks/obscures cabinet navigation (`22_*`, `38_*`).
4. **PD-P1-04** — Project detail dual tab IA (`36_*`).
5. **PD-P1-05** — Client portal contractor shell + Create first task (`39_*`).
6. **PD-P1-06** — No password-reset route (matrix NOT_IMPLEMENTED).

---

## 8. Accessibility risks and unverified checks

See `03_ACCESSIBILITY_RISK_REGISTER.csv`.

Unverified: VoiceOver/TalkBack, full keyboard order on cabinet, 200% zoom certification, Dynamic Type, reduced-motion, SR on modals, platform-admin ROMA a11y.

---

## 9. Localization / legal / content

- Public locales EN/RU/ES/IT homes render.
- Dashboard scoped `i18n:check` PASS.
- Legal pages still placeholder — R1 open.
- Login debug English string on all locale logins sampled.
- Hardcoded English density risk on tenant admin (not fully catalogued).

---

## 10. Design-system / Wave C stage

**Wave C — feature migration in progress.**

Wave A/B “complete” claims are **overstated** relative to missing `--lg-*` roots, legacy dual namespace, `check:design` FAIL, and mobile BrandTokens gap. Details: `04_DESIGN_SYSTEM_DRIFT.md`.

---

## 11. Backend ↔ UI mismatches

- Reset: UI missing.
- SCIM: API stub, no UI (expected).
- AI: configured keys ≠ LIVE UI claim (correctly not claimed).
- Client portal: UI shell not clearly customer-safe vs contractor ops.
- Draft security PRs may change RBAC after merge — not in runtime.

---

## 12. Blocked authenticated / device flows

| Flow | Missing input |
|------|----------------|
| Platform Admin Operations Center | Platform owner session / `platform_owner_grants` |
| iOS Manager screens | Bootable sim with Manager.app (existing device unavailable; no boot of foreign sims) |
| iOS Worker auth field path | UITest/E2E credentials file |
| Task detail / chat / approve-reject E2E | Safe mutation authorization + data |
| True client-persona portal | Dedicated client synthetic user |

---

## 13. Surface status counts (matrix)

From `01_FUNCTIONAL_SURFACE_MATRIX.csv` (34 rows):

| Status | Count |
|--------|------:|
| WORKS | 16 |
| PARTIAL | 10 |
| NEEDS_POLISH (flow audit only) | — (folded into PARTIAL/NEEDS in flow doc) |
| BROKEN | 0 |
| NOT_IMPLEMENTED | 2 |
| NOT_PROVEN | 0 |
| BLOCKED_EXTERNAL | 5 |
| DEFERRED | 1 |

---

## 14. Finding severity counts (backlog)

| Severity | Count |
|----------|------:|
| P0 | 0 proven |
| P1 | 6 |
| P2 | 8 |
| P3 / deferred | 3 |

---

## 15. Launch / pilot implication

Safe for **continued pilot engineering** on matching `02baa6a` runtime. **Not** a Client Day-0 GO: legal placeholders, cabinet first-run friction, client-shell clarity, and mobile authenticated evidence gaps remain. Do not claim GA or Wave C complete.

---

## 16. Recommended implementation order

1. **Product Design Remediation Slice 01** (this track; **not** completed by the audit handoff; **not** historical Liquid Glass Slice 1): remove login debug string; dismiss-persist welcome modal; green `check:design` raw-color hits — see ops prompt.

2. **R1 / legal:** Privacy/Terms real copy (owner/counsel).

3. **Product Design Remediation Slice 02:** project tab IA unify; client shell; AI status chip; iOS notification defer.

4. **Evidence follow-ups:** Manager sim capture; owner Operations Center visual pass; client-persona finance-safe DOM audit.

---

## 17. Honest verdict

### `PRODUCT_DESIGN_AUDIT_PARTIAL_BLOCKED_EXTERNAL`

Evidence pack complete for public + staging cabinet core; external/session/device gaps remain for Manager, Worker auth, platform owner, and true client persona.

---

## Publish privacy

Staging authenticated screenshots are **not** in the published git pack; they remain gitignored under `evidence/_local_unpublishable_staging/` after residual synthetic identity pixels could not be fully removed. Public/auth/iOS onboarding screenshots are published. Details: `08_PUBLISH_PRIVACY_NOTE.md` and `evidence/manifest.json`.

## Pointer update

`STATUS.md` and `docs/CURRENT_PROJECT_TRUTH_INDEX.md` are **pre-existing dirty** with R0.2 content. Surgical update would overwrite unrelated dirty work → **`POINTER_UPDATE_BLOCKED_DIRTY_OVERLAP`**.

Canonical new pointers for humans/agents:

- Audit pack: `docs/audit/product-design-current-main-2026-08-09/`
- Next prompt: `docs/ops/CURSOR_PRODUCT_DESIGN_SLICE_01_IMPLEMENTATION_PROMPT_2026-08-09.md`
- Track: **AUDIT_ONLY** (implementation NOT_GRANTED until Product Design Remediation Slice 01 auth)
- Naming: **Product Design Remediation Slice 01** ≠ already-implemented **Liquid Glass Slice 1** (public design foundation)

---

## Closure note

| Item | Value |
|------|-------|
| Files changed this run | Audit artifacts under `docs/audit/product-design-current-main-2026-08-09/` + Product Design Remediation Slice 01 prompt under `docs/ops/` + previously unpublished 2026-08-02 historical audit/roadmap for self-containment |
| Checks run | health apex/www/staging; security_headers.sh PASS; check:design FAIL (recorded); i18n:check PASS; Playwright captures; DOM keyboard sample; screenshot inspect+redact |
| Result | Partial audit complete with evidence |
| Remaining blockers | Listed in §12 |
| Manual production promotion | **NONE** |
| CI / preview / Worker builds | May run on docs PR push/merge (not claimed as “no build”) |
| External mutations | **NONE** |
| Pre-existing dirty preserved | **YES** |
| Verdict | PARTIAL_BLOCKED_EXTERNAL — **YES** for audit deliverable completeness within limits |
