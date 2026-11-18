# Git / Branch / Remote Operating Audit — AISTROYKA

> Stage B of the Project Operating System setup. Read-only inspection.
> Date: 2026-06-30

## 1. Current branch truth

| Field | Value |
|---|---|
| HEAD branch | `post-merge-pr171` |
| Tracking | `origin/main` |
| Ahead / behind origin/main | **0 / 0** (exactly at production tip) |
| HEAD commit | `171fedda` — "Merge pull request #171 … Android Play internal upload evidence" |
| `origin/HEAD` (default) | `origin/main` |
| Remote | `origin` → `git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git` (single remote, fetch+push) |

> The local checkout currently sits **on the production tip** under a `post-merge-prNNN` name rather than on `main`. `main` itself is checked out in a separate worktree (`/Users/alex/Projects/AISTROYKA-release-closure`, at `c600b7e6` — far behind). This is the existing operator pattern (post-merge validation branches), not a problem to fix here.

## 2. Working tree status (live at inspection)

Modified (uncommitted, pre-existing — NOT created by this setup):
- `M .gitignore`
- `M AGENTS.md`
- `M package-lock.json`

Untracked:
- `?? docs/web/` (web audit reports)
- `?? ios/ExportOptions-AppStore.plist`

> This setup will add files under `docs/ops/`, `docs/tasks/`, `docs/handoff/`, `docs/decisions/`, `docs/reports/`, and root `PROJECT_CONTEXT.md` / `STATUS.md`. None of the pre-existing uncommitted changes are touched or staged by this task.

## 3. Scale of branch/worktree sprawl (key finding)

| Metric | Count |
|---|---|
| Local branches | **194** |
| Remote branches | **142** |
| Registered worktrees | **38** |

Observed categories:
- `post-merge-prNNN` (122 → 171) — post-merge validation snapshots, many "behind origin/main".
- `audit/*`, `docs/*`, `chore/*`, `release/*`, `design/*`, `ai/*`, `fix/*`, `copy/*`, `test/*`.
- Several branches marked `: gone` (remote tracking branch deleted).
- Multiple worktrees pinned to old commits and detached HEADs under `~/.cursor/worktrees/AISTROYKA/*`.

**Risk for cloud agents:** a cloud agent landing in this repo cannot tell which branch is "live" from branch listing alone. The sprawl is the single biggest obstacle to safe phone-driven work. It must be made legible (not necessarily deleted) before cloud agents operate confidently.

## 4. Recommended branch model

| Branch | Meaning |
|---|---|
| `main` | **Production truth.** Protected. Only non-author-approved PR merges. |
| `staging` | Optional staging truth (staging deploy already exists via CI; a long-lived branch is optional — current flow deploys staging from `main`). |
| `ops/*` | Operating-system / infra / tooling work (this task = `ops/project-operating-system-setup`). |
| `feature/*` | Product features. |
| `fix/*` | Bug fixes. |
| `release/*` | Release candidates (e.g. existing `release/web-pilot-rc`, `release/mobile-pilot-rc`). |
| `audit/*` | Audit-only / docs-only investigations. |

Naming convention for future tasks: `<type>/<short-kebab-topic>[-issue-<N>][-<yyyy-mm-dd>]`.
Examples: `feature/portal-invite-resend`, `fix/sync-409-cursor`, `ops/cloud-agent-bootstrap`.

## 5. Protected-branch recommendation

`main` protection (per AGENTS facts, keep as-is):
- `enforce_admins: true`
- Require **1 non-author `APPROVED`** review (use `GITHUB_REVIEWER_TOKEN`; never self-approve).
- Require passing **CI Check** (`.github/workflows/ci-check.yml`).
- No direct pushes to `main`; no force push; no history rewrite.

## 6. What must be cleaned before cloud agents work safely

These are **recommendations only** — no deletion is performed here (HARD RULE + AGENTS archival policy).

1. **Reduce live ambiguity:** keep working from a clearly-named branch and keep `STATUS.md` pointing at the current active branch + commit so an agent never has to guess.
2. **Stale-branch archival (owner-gated):** follow the documented dry-run → owner approval → annotated `archive/<branch>/<date>` tags → docs-only execution PR flow. Never delete open-PR / dangerous / manual-review branches or `cursor/aistroyka-system-maturity-7957`.
3. **Worktree pruning:** `git worktree prune` for worktrees whose dirs are gone; consider consolidating the many `AISTROYKA-*` sibling worktrees. Owner decision required (do not remove without necessity).
4. **`post-merge-prNNN` snapshots:** these accumulate; archive/delete only via the gated flow.

## 7. Branch hygiene rules for every future task

- Branch from `origin/main` (fetch first). If `main` is occupied by another worktree, create a new worktree from `origin/main` rather than force-switching.
- One task = one branch = one `docs/tasks/*` file = one `docs/handoff/*` file.
- Never push to `main`; open a PR and merge via the protected path.
- No `git add .`; stage explicit paths.
- No force push, no `reset --hard`, no history rewrite.
