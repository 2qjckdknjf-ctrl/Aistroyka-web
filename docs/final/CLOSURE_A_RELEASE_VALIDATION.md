# Closure Sprint A — Release validation (repo + CI contract)

**Project:** Aistroyka  
**Scope:** Workstream A — what can be validated from the repository and local commands  
**Date:** 2026-03-23  

---

## 1. Automated checks tied to deploy

| Check | Where | Pass condition |
|-------|--------|----------------|
| Deploy secrets present | `deploy-cloudflare-prod.yml` step "Check env/config" | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` set |
| Build | `bun run cf:build` | Completes in CI |
| OpenNext artifact | `apps/web` — `.open-next/worker.js`, `.open-next/assets` | Exist after build |
| Bundle patch | `scripts/patch-bundle-require.cjs` on dry-run deploy output | Stub present in `worker-bootstrap.js` (step greps for middleware-manifest fix) |
| Pilot smoke secret | Job "Verify pilot smoke secret" | `PILOT_SMOKE_BEARER_PRODUCTION` non-empty |
| Post-deploy smoke | Reusable `pilot-smoke.yml` | `pilot_launch.sh` exits 0 against `https://aistroyka.ai` |

---

## 2. Migration apply workflow (manual dispatch)

| Step | Validation |
|------|------------|
| Env | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` required |
| Sanity | `check-migrations.sh` |
| Preview | `supabase db push --dry-run --yes` |
| Apply | `supabase db push --yes` |

**Note:** Success in CI means **commands ran**; **correct target project** is guaranteed only if secrets point to the intended Supabase project.

---

## 3. Local / developer validation (no production credentials)

Commands from Phase 0 baseline (see [`PHASE0_BASELINE_TRUTH_AUDIT.md`](./PHASE0_BASELINE_TRUTH_AUDIT.md)):

| Command | Role |
|---------|------|
| `npm run build` (repo root) | Contracts + web build |
| `npm run lint` | ESLint via `apps/web` |
| `npm run test` | Vitest suite |
| `npm run release:check` | **Requires** env vars; empty local env → expected FAIL for missing Supabase keys |

Подробная матрица сценариев (файлы `.env`, `NODE_ENV`, коды выхода): [`CLOSURE_A_RELEASE_READINESS.md`](./CLOSURE_A_RELEASE_READINESS.md). Индекс всех артефактов Closure A release: [`CLOSURE_A_RELEASE_INDEX.md`](./CLOSURE_A_RELEASE_INDEX.md).

---

## 4. Workstream C — Contact / leads (validation design)

**Repo proof (code path):**

- `POST /api/contact` — [`apps/web/app/api/contact/route.ts`](../../apps/web/app/api/contact/route.ts) inserts into `contact_leads` with `source: "contact_form"`, `status: "new"`.
- `GET /api/v1/admin/leads` — [`apps/web/app/api/v1/admin/leads/route.ts`](../../apps/web/app/api/v1/admin/leads/route.ts) lists rows (admin + tenant gate).

**Live proof (Phase 1C):** Public production handshake executed — Paperclip **AISAA-7** (marker `POST /api/contact` → 200; `GET /api/v1/admin/leads` unauthenticated → 401). **Operator follow-up:** confirm marker row in admin UI or authenticated GET.

**Original checklist (still useful for staging / regression):**

1. Submit production/staging contact form with traceable payload (unique email prefix).
2. Confirm row in Supabase `contact_leads` **or** API response from admin endpoint.
3. Capture evidence (redacted screenshot or log line) and attach to ticket.

**Silent failure modes to watch:** missing `SUPABASE_SERVICE_ROLE_KEY` on server → 500 generic body; RLS or table missing → insert error.

---

## Verdict (validation)

**CI contract:** Prod deploy workflow + blocking smoke + separate migration workflow are **defined and auditable**.  
**Local:** Build/lint/test are valid repo gates; `release:check` is a **gated** check, not a default local pass.  
**Contact E2E:** **Pending live run** with evidence.
