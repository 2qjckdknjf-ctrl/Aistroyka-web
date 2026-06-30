# Architecture Rules — Agent Memory

> Durable rules for all agents. Supersedes guesswork; defers to `PROJECT_CONTEXT.md` for product detail.

**Last updated:** 2026-06-30

## Repository & git

- `origin/main` = **production truth**
- Branch per task; PR per task; protected merge only
- No force push · no `git branch -D` · no direct push to `main`
- Stage explicit paths; never `git add .`
- When unsure → `KEEP_REVIEW`

## Work types

- **Docs/process tasks** → no product code, no migrations, no deploy
- **Feature tasks** → follow roadmap; customer-finance safe
- **Ops/cleanup tasks** → owner-gated dry-run first; Slice 1 pattern for execution

## Validation & merge

- Run validation subset before PR (`docs/ops/VALIDATION_CHECKLIST.md`)
- CI Check must pass
- Non-author APPROVED review required
- Verify `buildStamp` for deploy claims — never fake success

## Handoff discipline

- Handoff before stopping any non-trivial session
- Update `STATUS.md` + indexes
- Mark `safe to continue from phone: YES/NO`

## Surfaces

- Web: `apps/web` · Cloudflare Workers production runtime
- Mobile: iOS primary; Android thinner
- DB: Supabase project `vthfrxehrursfloevnlp` (eu-central-1)
- AI: `apps/web` only; live gate `scripts/smoke/ai_live_provider.sh --require-live`
