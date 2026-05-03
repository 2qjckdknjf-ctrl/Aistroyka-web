# LIVE Deploy Truth (2026-05-01)

## Scope

- Verify staging/production health and build stamps.
- Compare deployed build stamps with current local git commit.
- Establish deploy truth (what is actually live now).

## Executed checks

1. `curl -i https://aistroyka.ai/api/v1/health`
   - HTTP `200`
   - Body:
     - `ok=true`
     - `env="production"`
     - `buildStamp.sha7="e509f53"`
     - `buildStamp.buildTime="2026-04-27 10:49"`

2. `curl -i https://staging.aistroyka.ai/api/v1/health`
   - HTTP `200`
   - Body:
     - `ok=true`
     - `env="staging"`
     - `buildStamp.sha7="e3abb52"`
     - `buildStamp.buildTime="2026-04-26 14:08"`

3. Local git baseline
   - `git rev-parse --short HEAD` -> `7178c6bb`

4. Local git metadata for deployed SHAs
   - `git show -s --format='prod_sha=%h prod_commit_time=%ci prod_subject=%s' e509f53`
     - `prod_sha=e509f537`
     - `prod_commit_time=2026-04-27 12:49:22 +0200`
     - `prod_subject=Merge PR #11: pilot audit E2E, staging CI hook, public UI fixes`
   - `git show -s --format='staging_sha=%h staging_commit_time=%ci staging_subject=%s' e3abb52`
     - `staging_sha=e3abb52e`
     - `staging_commit_time=2026-04-26 16:07:50 +0200`
     - `staging_subject=test: stabilize dashboard button audit timeout`

## Findings

- Production and staging health endpoints are live and return valid JSON payloads.
- Build stamps include both required fields: `buildStamp.sha7` and `buildStamp.buildTime`.
- Current local head (`7178c6bb`) is ahead of both deployed environments:
  - production: `e509f53`
  - staging: `e3abb52`
- Deployed build stamps are internally consistent with local git history.

## Verdict

- Production health: **PASS**
- Staging health: **PASS**
- Deploy truth established: **PASS**
- Deploy parity with local HEAD: **FAIL** (both environments behind local commit)
