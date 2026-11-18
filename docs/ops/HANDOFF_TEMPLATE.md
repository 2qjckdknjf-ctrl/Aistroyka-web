# Handoff Template

> Copy to `docs/handoff/<yyyy-mm-dd>-<topic>.md` when pausing or finishing a task.
> This is the bridge between phone ↔ desktop and agent ↔ agent. Be precise.

---

## Summary
<2–4 sentences: what was attempted and where it stands>

## Branch
`<type>/<topic>` — based on `origin/main`

## Commits
- `<sha7>` — <message>
- ...

## Changed files
- `path` — <what changed and why>
- ...

## Validation performed
| Check | Command | Result |
|---|---|---|
| Lint | `bun run lint` | pass / fail / not run |
| Typecheck | `bunx --cwd apps/web tsc --noEmit` | |
| Tests | `bun run test` | |
| Build | `bun run cf:build` | |
| i18n | `bun run i18n:check` | |
| CI Check (PR) | GitHub Actions | green / red / pending |

## What passed
- 

## What failed
- 

## Unresolved blockers
- 

## Exact next step
<the single most concrete next action for whoever resumes>

## Operator actions required
- [ ] <e.g. set GitHub secret X / approve PR / install Supabase CLI / approve deploy>

## Safe to continue from mobile?
YES / NO — <reason>

## Safe to continue from desktop?
YES / NO — <reason>
