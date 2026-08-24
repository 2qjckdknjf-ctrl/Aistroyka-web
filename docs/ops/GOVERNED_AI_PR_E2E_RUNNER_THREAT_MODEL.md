# Governed AI PR E2E runner — threat model

## Assets

- Staging Supabase data (QA tenant/project)
- Worker/manager/owner QA credentials
- Vercel automation bypass secret
- PR branch code at verified SHA (unreviewed until product PR merges)

## Trust boundaries

| Zone | Access |
|------|--------|
| Job 1 `trust-boundary-preflight` | GitHub token only; **no** staging secrets |
| Job 2 `governed-ai-pr-e2e` | Protected `staging` environment after Job 1 success |
| PR checkout code | Exact SHA validated against live PR head via GitHub API |

## Threats and mitigations

| Threat | Mitigation |
|--------|------------|
| Malicious PR from fork | Reject fork PRs; same-repo head required |
| SHA confusion / stale Preview | Input SHA must equal live PR head; health `buildStamp.sha7` must match |
| Arbitrary Preview host | Allowlist `https://aistroyka-web-web-v7jq*.vercel.app` only |
| Secret exfiltration via PR code | **No** `SUPABASE_SERVICE_ROLE_KEY`; checkout runs untrusted PR script with cookie/API personas only |
| Bypass token in logs/artifacts | Header-only bypass; redacted artifacts; no query-param bypass |
| Wrong project mutated | **Required** `PILOT_SMOKE_PROJECT_ID_STAGING` variable; no auto-discovery |
| Over-privileged workflow token | `contents: read`, `pull-requests: read`; Job 2 drops PR write |
| `pull_request_target` RCE | **Not used** |
| Draft PR accidental run | Operator must dispatch manually with confirmation string |

## Residual risk

- PR E2E script at verified SHA could attempt credential misuse within worker/manager/owner API scope. Mitigated by pinned QA project, disposable QA data, and environment approval gate.

## Out of scope

- Production deploy, migration apply, PR merge (workflow never performs these)
