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
| Job 2 `governed-ai-pr-e2e-staging-gate` | Protected `staging` after Job 1; secret-name preflight + seal private-key preflight; deployment revalidation; **no PR checkout** |
| Job 3 `governed-ai-pr-e2e-harness` | Protected `staging`; PR checkout (`persist-credentials: false`); sanitized `env -i` harness subprocess; RSA-OAEP + AES-256-GCM seal with committed public key; uploads **encrypted bundle artifact only**; **no** cache save |
| Job 4 `governed-ai-pr-e2e-seal` | Fresh VM; trusted dispatch-pinned ops only (**no PR checkout**); downloads harness sealed artifact; verifies manifest binding + AEAD auth; trusted `actions/cache/save` with exact run-bound key |
| Job 5 `governed-ai-pr-e2e-postprocess` | Fresh VM; exact cache restore (`fail-on-cache-miss`); unseals with `GOVERNED_E2E_SEAL_PRIVATE_KEY`; trusted redactor/verdict from workflow ref |
| Job 6 `governed-ai-pr-e2e-verdict` | No secrets; fail closed on skipped/failed gate, harness, seal, or postprocess jobs |
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

### Status provenance (authoritative `environment_url`)

Latest deployment status is validated **independently** from deployment creation:

| Check | Requirement |
|-------|-------------|
| Belongs to deployment | `deployment_url` ends with `/deployments/{deployment_id}` when present |
| Creator login | exact `vercel[bot]` |
| Creator immutable ID | exact `35613825` |
| Creator type | `Bot` |
| GitHub App (when present) | id `8329`, slug `vercel` |
| State | latest by `created_at`, tie-break numeric status id |
| Latest state value | exact `success` only |
| Environment | `Preview` when field present |
| `environment_url` | present; canonical Preview origin source |

**Fail-closed fallback:** when `performed_via_github_app` is null on status (observed on deployment `6064462333`), exact bot login+id is mandatory. Residual risk: a compromised `vercel[bot]` account could post status URLs — mitigated by repository-scoped deployment ID + SHA binding and defense-in-depth hostname checks.

Statuses are fetched with pagination (`per_page=100`, follow `Link: rel="next"`) up to 20 pages; truncated pagination fails closed.

### Final E2E acceptance

Workflow success requires harness exit code `0`, exact verdict `PROVEN`, and **25/25 steps with exact status `PASS`**. Optional harness behaviors (`BLOCKED_EXTERNAL`, steps 23–24 skip paths) are **not** accepted as warnings — they fail the runner contract.

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
| Attacker-owned lookalike Preview host | GitHub Deployment ID binding + independent status provenance + exact `environment_url` match + project/team hostname defense-in-depth |
| Static hostname drift on new Preview deployments | No static hostname trust root; new deployments only need correct `deployment_id` + matching URL from GitHub API |
| Status from non-Vercel identity | Latest status must be `vercel[bot]` id `35613825`; App metadata when present must match Vercel app; evidence records observed App ids/slugs (nullable) plus explicit `*_provenance_method` |
| Stale success after newer failure | Latest status selected by timestamp/id; non-success latest state fails binding |
| Status drift after environment approval | Job 2 re-fetches all statuses and revalidates latest status creator/state/URL before PR checkout |
| PR E2E script at verified SHA runs with QA personas | Fixed entrypoint path only; `bun install --ignore-scripts`; pinned QA project; disposable QA data; no service-role; protected staging approval; owner-reviewed dispatch; trusted redaction/verdict in **separate Job 3 VM** (not same process as PR harness) |
| Bypass token in logs/artifacts | Header-only bypass; harness runs in sanitized subprocess; plaintext deleted before encrypted artifact upload; seal job verifies AEAD + manifest binding on fresh VM; cache save only after auth; postprocess uploads redacted artifact only |
| PR harness poisons trusted shell via BASH_ENV/GITHUB_ENV/PATH | Harness launched via `env -i` with `BASH_ENV=/dev/null` and `ENV=/dev/null`; trusted PATH allowlist; post-harness step resets poisoning vectors before trusted steps; seal/postprocess on fresh VMs without PR code |
| Cache replay / wrong-run restore | Cache key binds `run_id`, `run_attempt`, `dispatch_sha`, `target_sha`, `pull_request_number`, `deployment_id`; no `restore-keys`; miss → fail; manifest inside ciphertext must match trusted GitHub context |
| Wrong project mutated | **Required** `PILOT_SMOKE_PROJECT_ID_STAGING` variable; no auto-discovery |
| Feature-branch workflow tampering | Job 1 + Job 2 require `github.ref == refs/heads/main`; Job 2 additionally requires protected staging preflight |
| Unprotected staging environment | Job 1 fails with `BLOCKED_STAGING_ENVIRONMENT_UNPROTECTED` when misconfigured |
| Over-privileged workflow token | `contents: read`, `pull-requests: read`, `deployments: read`; Job 2 drops PR write |
| `pull_request_target` RCE | **Not used** |
| False-green skipped E2E | Verdict job fails when secret-consuming E2E or postprocess job skipped |
| PR harness tampers post-E2E trusted steps | Seal and postprocess run on fresh VMs; harness exit code validated and passed via job output allowlist; redaction/verdict never run in harness UID |
| False-green harness verdict | Success requires exit `0` + `PROVEN` + exactly 25/25 `PASS` + matching base/sha7 |
| False-green partial optional steps | `BLOCKED_EXTERNAL` and non-`PASS` step statuses fail the runner contract |
| TOCTOU after environment approval | Job 2 revalidates PR head + deployment + latest status binding before PR checkout |
| Draft PR accidental run | Operator must dispatch manually with confirmation string |

## Residual risk

- PR E2E script at verified SHA could attempt credential misuse within worker/manager/owner API scope. Mitigated by pinned QA project, disposable QA data, environment approval gate, GitHub Deployment binding, and `bun install --ignore-scripts`.
- Operator must supply the correct GitHub Deployment ID for the Preview under test (from PR checks/deployments UI).
- PR head may move during environment approval wait — mitigated by post-approval SHA + deployment revalidation before checkout.
- Concurrent dispatches for the same PR queue rather than cancel in-flight runs (`cancel-in-progress: false`).

## Out of scope

- Production deploy, migration apply, PR merge (workflow never performs these)
