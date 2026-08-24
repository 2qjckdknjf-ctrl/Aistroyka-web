# Governed AI PR E2E runner — threat model

## Assets

- Staging Supabase data (QA tenant/project)
- Worker/manager/owner QA credentials
- Vercel automation bypass secret
- PR branch code at verified SHA (unreviewed until product PR merges)

## Trust boundaries

| Zone | Access |
|------|--------|
| Job 1 `trust-boundary-preflight` | GitHub token + read-only environment metadata; **no** staging secrets |
| Job 2 `governed-ai-pr-e2e` | Protected `staging` environment after Job 1 success and main-ref guard |
| Job 3 `governed-ai-pr-e2e-verdict` | No secrets; fail closed on skipped secret job |
| PR checkout code | Exact SHA validated against live PR head via GitHub API |
| Trusted runner ops | Redaction/validation scripts from workflow ref (`main`), not PR code |

## Canonical Preview hostname

Exact match only:

`aistroyka-web-web-v7jq-git-fea-3e326e-2qjckdknjf-ctrls-projects.vercel.app`

Operator input is validated by `validate-preview-url.mjs` against `governed-ai-pr-e2e-runner.constants.ts`. Subsequent steps use the canonical URL output only.

## Threats and mitigations

| Threat | Mitigation |
|--------|------------|
| Malicious PR from fork | Reject fork PRs; same-repo head required |
| SHA confusion / stale Preview | Input SHA must equal live PR head; health `buildStamp.sha7` must match |
| Attacker-owned lookalike Preview host | **Exact** hostname allowlist; no wildcard/substring/`endsWith("vercel.app")` |
| PR E2E script at verified SHA runs with QA personas | Fixed entrypoint path only; pinned QA project; disposable QA data; no service-role; protected staging approval; exact Preview hostname; threat accepted for open PR validation — see residual risk |
| Bypass token in logs/artifacts | Header-only bypass; stdout/stderr captured to ephemeral files; redacted artifact only |
| Wrong project mutated | **Required** `PILOT_SMOKE_PROJECT_ID_STAGING` variable; no auto-discovery |
| Feature-branch workflow tampering | Job 1 + Job 2 require `github.ref == refs/heads/main`; Job 2 additionally requires protected staging preflight |
| Unprotected staging environment | Job 1 fails with `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` when `protection_rules` are empty, required reviewers are missing, or deployment branches are not restricted to only `main` |
| Over-privileged workflow token | `contents: read`, `pull-requests: read`, `deployments: read`; Job 2 drops PR write |
| `pull_request_target` RCE | **Not used** |
| False-green skipped E2E | Verdict job fails when secret-consuming job skipped |
| Draft PR accidental run | Operator must dispatch manually with confirmation string |

## Residual risk

- PR E2E script at verified SHA could attempt credential misuse within worker/manager/owner API scope. Mitigated by pinned QA project, disposable QA data, environment approval gate, and exact Preview hostname pinning.
- Preview alias drift requires a reviewed constants change when Vercel branch URL changes.

## Out of scope

- Production deploy, migration apply, PR merge (workflow never performs these)
