# PR #17 Final Merge Recommendation

## PR scope status

- PR: <https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/17>
- Scope posture: publication-focused after split cleanup.
- Cloudflare-agent starter is no longer part of publication branch diff.

## Cloudflare-agent decision

- Decision: **SPLIT_OUT**
- Preservation branch pushed: `release/cloudflare-agent-starter-split`
- Rationale: non-blocking feature for publication readiness; separating it reduces merge risk.

## Validation status snapshot

1. Production redeploy + buildStamp proof: closed.
2. Blocking production pilot smoke workflow: passing.
3. Final quality rerun: pass on core build/test/lint/cf build.
4. Remaining blockers:
   - Supabase live migration parity closed by operator evidence.
   - system-health allow-path proof with real key captured by operator evidence.
   - iOS full runtime transaction coverage still partial (login-screen smoke only).
   - AI stream-project probe is closed; provider-backed non-fallback path remains partial.
   - browser visual locale/contact QA closed by post-deploy verification.

## Recommendation (updated after live-closure rerun)

- **READY_TO_MERGE_FOR_PILOT**

Reason:

- P0 live blockers are now closed.
- P1 items remain partial, so merge is recommended for controlled pilot/public-candidate progression, not full GA claim.

## Draft status recommendation

- PR should **remain draft** until:
  1. Release owner explicitly accepts remaining P1 partials.
  2. Final GA decision is made only after P1 closures or explicit acceptance.

## Exact next commands (operator)

```bash
bun run test
bun run build
bun run cf:build

gh secret set PILOT_SMOKE_PROJECT_ID_PRODUCTION --repo 2qjckdknjf-ctrl/Aistroyka-web --body "<project_uuid>"
gh workflow run deploy-cloudflare-prod.yml --repo 2qjckdknjf-ctrl/Aistroyka-web --ref main -f ref=main
gh run watch <new_run_id> --repo 2qjckdknjf-ctrl/Aistroyka-web --exit-status
```

