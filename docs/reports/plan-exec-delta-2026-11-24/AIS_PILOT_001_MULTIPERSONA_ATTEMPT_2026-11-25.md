# AIS-PILOT-001 multi-persona attempt — 2026-11-25

Follow-up to `AIS_PILOT_001_EVIDENCE_2026-11-25.md`.

## Attempt

Synthetic pilot personas from `local-secrets/synthetic-pilot-users*` (manager/worker/client/owner) authenticate to Supabase Auth successfully.

Against `https://staging.aistroyka.ai/api/v1/*` with those JWTs, Cloudflare returns **HTTP 403** `error code: 1010` before application handlers run.

Smoke user (`SMOKE_*`) continues to reach the app (projects/completeness/reports 200).

## Verdict

| Item | Status |
|---|---|
| Synthetic Auth mint | PASS |
| Synthetic → staging API peer isolation | **BLOCKED** (CF 1010 / WAF) |
| Smoke-user staging API | PASS (separate evidence) |

**Overall multi-persona live matrix:** superseded 2026-11-26 — with browser `User-Agent`, synthetic personas reach staging API; isolation matrix PASS (see `OWNER_GATE_FOLLOWTHROUGH_2026-11-26.md`). Prior CF 1010 was signature/UA, not a persona allow-list.

## Explicit non-claims

- Auth success for synthetic users is not peer-isolation proof.
- Do not invent foreign-tenant deny results for CF-blocked calls.
