# LIVE Deploy Truth (2026-05-01)

## Scope

- Verify production health endpoint payload.
- Compare deployed build stamp with current local git commit.

## Executed checks

1. `curl -i https://aistroyka.ai/api/v1/health`
   - HTTP: `200`
   - Payload includes:
     - `"ok": true`
     - `"env": "production"`
     - `buildStamp.sha7 = "e509f53"`
     - `buildStamp.buildTime = "2026-04-27 10:49"`

2. Local current commit:
   - `git rev-parse --short HEAD` -> `e89b4854`

3. Local metadata for deployed SHA from health payload:
   - `git show -s --format='%h %ci %s' e509f53`
   - Output:
     - `e509f537 2026-04-27 12:49:22 +0200 Merge PR #11: pilot audit E2E, staging CI hook, public UI fixes`

## Findings

- Production endpoint is live and healthy (`/api/v1/health` returns 200 + expected JSON).
- Deployed production revision (`e509f53`) is **behind** current local branch head (`e89b4854`).
- Build stamp is internally consistent with historical commit data in local repository.

## Verdict

- Production health check: **PASS**
- Production deploy parity with current branch head: **FAIL** (not on latest local head)
- Production deploy truth verification: **PASS** (truth established; parity mismatch documented)
