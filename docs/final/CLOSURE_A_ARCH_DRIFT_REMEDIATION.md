# Closure Sprint A — Architecture drift remediation (minimal)

**Project:** Aistroyka  
**Principle:** Narrow fixes only; no giant refactors without CEO/board alignment  
**Date:** 2026-03-23  

---

## 1. Accepted as-is (document, do not delete yet)

| Item | Action |
|------|--------|
| Root `middleware.ts`, `lib/`, `components/` | **Label legacy** in repo map docs (this closure set + [`PHASE0_ARCHITECTURE_MAP.md`](./PHASE0_ARCHITECTURE_MAP.md)). Deletion risks confusing tooling or rare entrypoints — defer until a dedicated cleanup ticket with full build matrix. |
| Dual package paths (bun CI vs npm Vercel) | **Document** in onboarding: “CI prod uses Bun; Vercel build uses npm scripts from root.” |

---

## 2. Low-cost hygiene (recommended next commits — optional)

| Change | Rationale |
|--------|-----------|
| Add a one-line **README** or `docs/` pointer at root `lib/README.md` | **Сделано:** [`lib/README.md`](../../lib/README.md) — пометка legacy и ссылка на `apps/web/lib` и closure-документы. |
| New public HTTP handlers → prefer **`/api/v1/...`** | Reduces policy/middleware exceptions |

---

## 3. Not in scope for Closure A

- Merging or deleting root `lib` without proving zero consumers across **all** build targets.
- Renaming all legacy `/api/*` routes to `/api/v1/*` (breaking change for any external clients).
- Full documents workflow QA (Workstream D product sign-off).

---

## Verdict

**Remediation = documentation + conventions**, not code churn. Concrete deletes/renames belong to **follow-up issues** with test and deploy plan.
