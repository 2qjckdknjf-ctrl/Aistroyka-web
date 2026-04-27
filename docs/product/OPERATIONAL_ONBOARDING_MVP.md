# Operational onboarding MVP (Step 8)

**Scope:** Refinement of post-plan-selection setup flow. No checkout, paywall, or giant wizard.

## Operational milestones

A new workspace is **operationally onboarded** when all of the following are true:

1. **Plan selected** — User has chosen a canonical plan (via recommendation flow or legacy).
2. **Workspace profile minimally identified** — `tenants.name` is set (workspace/company name).
3. **First project created** — At least one project exists.
4. **Team / invite readiness** — At least one invite sent OR more than one member (owner + collaborator).
5. **Ready for dashboard work** — All above done; user can proceed to dashboard.

## Setup checkpoints (alignment with setup readiness v2)

| Checkpoint | Meaning | Target route |
|------------|---------|--------------|
| `workspace_name_set` | `tenants.name` is non-empty | `/team` |
| `first_project_created` | At least one project | `/projects/new` |
| `has_invited_or_collaborator` | `tenant_members` > 1 or `tenant_invitations` > 0 | `/team` |

## Recommended order

For a brand-new workspace:

1. Set workspace name (if missing) → `/team`
2. Create first project → `/projects/new`
3. Invite team (if desired) → `/team`
4. Open dashboard → `/dashboard`

The evaluator recommends the next action based on what is missing.

## Legacy safety

- Workspaces with projects are never blocked.
- `minimally_ready` and `ready_for_dashboard` both allow dashboard access.
- Orchestration only shows `continue_workspace_setup` when `nextStep` is that; no forced redirect for legacy users.
