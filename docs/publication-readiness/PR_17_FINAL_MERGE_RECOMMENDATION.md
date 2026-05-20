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
   - Supabase live migration parity external-blocked.
   - system-health allow-path proof with real key not yet captured.
   - iOS full runtime transaction coverage still partial (login-screen smoke only).
   - AI full provider path and stream-project probe partial.
   - full browser visual locale QA partial.

## Recommendation (updated after live-closure rerun)

- **MERGE_AFTER_LIVE_BLOCKERS**

Reason:

- The PR is materially strong for controlled pilot progression, but GO_PUBLIC criteria are not yet met.
- Merge should happen only when operator closes remaining P0/P1 live proofs documented in final audit.
- Current branch quality remains strong for pilot progression, but GO_PUBLIC evidence is still incomplete.

## Draft status recommendation

- PR should **remain draft** until:
  1. Supabase parity closure evidence is attached.
  2. System-key allow-path proof is attached.
  3. Release owner explicitly accepts remaining P1 partials for pilot-only merge.

## Exact next commands (operator)

```bash
cd apps/web
supabase login
supabase link --project-ref <PROJECT_REF>
export SUPABASE_DB_PASSWORD='<DB_PASSWORD>'
supabase migration list
supabase db push --dry-run --linked

export SYSTEM_API_KEY='<REAL_KEY>'
curl -i https://aistroyka.ai/api/system/health -H "X-System-Key: $SYSTEM_API_KEY"
```

