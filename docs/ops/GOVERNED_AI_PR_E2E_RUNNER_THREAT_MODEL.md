# Governed AI PR E2E runner — threat model

## Assets

- Staging Supabase data (QA tenant/project)
- Worker/manager/owner QA credentials
- Vercel automation bypass secret
- PR branch code at verified SHA (unreviewed until product PR merges)

## Trust boundaries

| Zone | Access |
|------|--------|
| Job 1 `trust-boundary-preflight` | GitHub token + read-only environment/deployment metadata; **no** staging secrets |
| Job 2 `governed-ai-pr-e2e` | Protected `staging` environment after Job 1 success and main-ref guard |
| Job 3 `governed-ai-pr-e2e-verdict` | No secrets; fail closed on skipped secret job |
| PR checkout code | Exact SHA validated against live PR head via GitHub API |
| Trusted runner ops | Validation/redaction scripts from workflow ref (`main`), not PR code |

## Canonical Preview URL authority

**Trust root:** GitHub Deployment binding, not a static hostname on `main`.

Operator dispatch must include:

| Input | Purpose |
|-------|---------|
| `deployment_id` | Positive decimal GitHub Deployment ID for the Vercel Preview |
| `target_sha` | Exact 40-char PR head SHA |
| `preview_base_url` | Must exactly match trusted `environment_url` from that deployment's latest **success** status |

Job 1 fetches deployment + statuses via GitHub API and validates:

- Repository = `2qjckdknjf-ctrl/Aistroyka-web`
- Deployment SHA = `target_sha`
- Environment = `Preview`
- Creator = official Vercel integration (`vercel[bot]`, id `35613825`) or GitHub App `vercel` (id `8329`)
- Latest status state = `success`
- Normalized `environment_url` equals operator `preview_base_url`

**Defense-in-depth hostname constraints** (not the trust root):

- `https:` only, no userinfo/port/path/query/fragment
- Hostname ends with `.vercel.app`
- Project prefix `aistroyka-web-web-v7jq-`
- Team suffix `-2qjckdknjf-ctrls-projects.vercel.app`
- Deployment token segment lowercase alphanumeric

Job 2 uses the **canonical URL from GitHub deployment metadata** only. Raw operator input is never forwarded as authoritative after validation.

## Vercel GitHub integration evidence (PR #244 example)

| Field | Value |
|-------|-------|
| GitHub App | [Vercel](https://github.com/apps/vercel) — id **8329**, slug **vercel** |
| Deployment creator | `vercel[bot]` — id **35613825** |
| Note | `performed_via_github_app` may be null; creator bot identity is the observed trust signal |

## Threats and mitigations

| Threat | Mitigation |
|--------|------------|
| Malicious PR from fork | Reject fork PRs; same-repo head required |
| SHA confusion / stale Preview | Input SHA must equal live PR head; deployment SHA must match; health `buildStamp.sha7` must match |
| Attacker-owned lookalike Preview host | GitHub Deployment ID binding + exact `environment_url` match + project/team hostname defense-in-depth |
| Static hostname drift on new Preview deployments | No static hostname trust root; new deployments only need correct `deployment_id` + matching URL from GitHub API |
| PR E2E script at verified SHA runs with QA personas | Fixed entrypoint path only; `bun install --ignore-scripts`; pinned QA project; disposable QA data; no service-role; protected staging approval; owner-reviewed dispatch — see residual risk |
| Bypass token in logs/artifacts | Header-only bypass; stdout/stderr captured to ephemeral files; redacted artifact only |
| Wrong project mutated | **Required** `PILOT_SMOKE_PROJECT_ID_STAGING` variable; no auto-discovery |
| Feature-branch workflow tampering | Job 1 + Job 2 require `github.ref == refs/heads/main`; Job 2 additionally requires protected staging preflight |
| Unprotected staging environment | Job 1 fails with `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` when misconfigured |
| Over-privileged workflow token | `contents: read`, `pull-requests: read`, `deployments: read`; Job 2 drops PR write |
| `pull_request_target` RCE | **Not used** |
| False-green skipped E2E | Verdict job fails when secret-consuming job skipped |
| False-green harness verdict | Success requires exit code 0 **and** exact structured verdict `PROVEN` |
| TOCTOU after environment approval | Job 2 revalidates PR head + deployment binding before PR checkout |
| Draft PR accidental run | Operator must dispatch manually with confirmation string |

## Residual risk

- PR E2E script at verified SHA could attempt credential misuse within worker/manager/owner API scope. Mitigated by pinned QA project, disposable QA data, environment approval gate, GitHub Deployment binding, and `bun install --ignore-scripts`.
- Operator must supply the correct GitHub Deployment ID for the Preview under test (from PR checks/deployments UI).
- PR head may move during environment approval wait — mitigated by post-approval SHA + deployment revalidation before checkout.
- Concurrent dispatches for the same PR queue rather than cancel in-flight runs (`cancel-in-progress: false`).

## Out of scope

- Production deploy, migration apply, PR merge (workflow never performs these)
