# AI Flywheel CI cf:build Evidence

**Date:** 2026-06-17  
**Sprint:** AI Flywheel Tail Closure

## Workflow

| Field | Value |
|-------|-------|
| Workflow file | `.github/workflows/ci-check.yml` |
| Workflow name | **CI Check** |
| Trigger | `pull_request` to `main` / `master` |
| cf:build step | **Cloudflare bundle (no deploy)** → `bun run cf:build` |

## Proven CI run (concrete)

Fetched via GitHub Actions API (public repo):

| Field | Value |
|-------|-------|
| Run ID | **27669872727** |
| Run number | 214 |
| URL | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27669872727 |
| Event | `pull_request` |
| Head branch | `feat/p1-footer-tokens` |
| Head SHA | `406e1888341b8f165b11ae63a290bbdb3c4fc542` |
| Status | `completed` |
| Conclusion | **success** |
| Created | 2026-06-17T06:19:27Z |
| Updated | 2026-06-17T06:23:01Z |

### Job steps (all success)

| Step | Result |
|------|--------|
| Install dependencies | success |
| i18n messages | success |
| Lint | success |
| Typecheck | success |
| Test | success |
| Release readiness policy check | success |
| **Cloudflare bundle (no deploy)** | **success** |

## Local proof (same sprint)

```bash
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export NEXT_PUBLIC_APP_URL=https://staging.aistroyka.ai
bun run cf:build
```

Exit 0 — OpenNext bundle complete (documented in P2 hardening).

## Operator note

Local `gh` CLI unavailable (bad CPU type in this environment). CI evidence captured via `curl` to `api.github.com`.

To re-verify:

```bash
gh run view 27669872727 --log | grep -A2 "Cloudflare bundle"
```

---

## Verdict

| Item | Status |
|------|--------|
| cf:build in CI workflow | YES |
| Concrete CI run proven | **YES** (run 27669872727) |
| Local cf:build | YES (P2 + tail closure) |
