# Task Template

> Copy to `docs/tasks/<type>-<topic>.md` at the start of every task. Fill all sections.

---

## Task name
<concise name>

## Branch
`<type>/<short-kebab-topic>` (from `origin/main`)

## Goal
<one or two sentences: the outcome, not the steps>

## Scope (what this task WILL do)
- 

## Out of scope (what this task will NOT do)
- 

## Files allowed to change
- 

## Files / areas NOT allowed to change
- Tenant / auth / middleware logic (unless explicitly the task)
- Billing/account gates (`ENTITLEMENT_RESOLUTION_SOURCE`, billing reads)
- Production/Cloudflare/Supabase config
- Customer-finance boundary surfaces
- 

## Required checks (subset of VALIDATION_CHECKLIST.md)
- [ ] `bun run i18n:check` (if user-visible strings changed)
- [ ] `bun run lint`
- [ ] `bunx --cwd apps/web tsc --noEmit`
- [ ] `bun run test`
- [ ] `bun run cf:build` (if web build surface affected)
- [ ] Other: 

## Completion criteria
- 

## Handoff requirements
- [ ] `docs/handoff/<date>-<topic>.md` written
- [ ] `STATUS.md` updated (branch, commit, next step, handoff link)
- [ ] PR opened via protected path (no self-approve)

## Rollback notes
<how to revert safely if this goes wrong; which commit/PR to revert; any data implications>
