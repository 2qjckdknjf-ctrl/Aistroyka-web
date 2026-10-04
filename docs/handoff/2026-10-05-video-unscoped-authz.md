# Handoff — #385 vision RPC + #386 video unscoped authz

Date: 2026-10-05. Do not treat this file as live GitHub truth; refresh PR HEAD/CI/review first.

## Working folders

| Item | Path | Branch | HEAD |
|---|---|---|---|
| Video authz | `/Users/alex/Projects/AISTROYKA-video-unscoped-authz` | `fix/ai-video-unscoped-authz-2026-10-05` | `fe681543` |
| Vision RPC | `/Users/alex/Projects/AISTROYKA-vision-request-key` | `feature/vision-request-key-atomic-2026-10-04` | `906c9ef7` |
| Canonical clean | `/Users/alex/Projects/AISTROYKA-main-clean` | do not occupy for these PRs | `origin/main` `ee162ea4` |

Do not switch `/Users/alex/Projects/AISTROYKA`.

## Done

- [#381](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/381)/[#383](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/383)/[#384](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/384) merged.
- [#382](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/382) merged `ee162ea4`. Production and staging health: `buildStamp.sha7=ee162ea` (published). Customer estimates/requests device smoke: `DEVICE_SMOKE_PARTIAL`.
- [#385](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/385) HEAD `906c9ef7`: 3-arg PostgREST compatibility until 4-arg RPC exists; unique-violation path binds null-key fallback. Codex P1 threads on `rpcClient.ts` / migration unique handler replied and resolved. Local vision vitest previously green; CI on this HEAD was PENDING at handoff. `reviewDecision=REVIEW_REQUIRED` (no non-author APPROVED). Merge BLOCKED.
- [#386](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/386): unscoped `analyze-video-daily` always `requireTenant` (legacy `/api/ai` re-export included). Authenticated unscoped still allowed; `project_id` still 403/404. Vitest 8/8. Reviewer `6262265-cpu` requested. CI PENDING at handoff.

## Live DB (read-only, 2026-10-05)

| Object | State |
|---|---|
| `create_analysis_job` | 3-arg only (`p_tenant_id, p_media_id, p_priority`), SECURITY DEFINER, EXECUTE `postgres`+`service_role` |
| `analysis_jobs.request_key` | present |
| `construction_graph_nodes` | present |
| `customer_intake_drafts` | absent |

Do not apply `20261004180000_create_analysis_job_request_key.sql` or intake migration without OWNER_GATE. After merge, apply staging-first. Operator checks: [STAGING_CREATE_ANALYSIS_JOB_REQUEST_KEY_VERIFY.md](../ops/STAGING_CREATE_ANALYSIS_JOB_REQUEST_KEY_VERIFY.md).

## Blocked (do not bypass)

- Independent APPROVED on current #385 HEAD after required `check` SUCCESS, then protected merge.
- Same for #386.
- Staging-first RPC apply (OWNER_GATE).
- Intake table apply (OWNER_GATE).
- Customer iOS portal estimates/requests physical smoke.

## Next after this pause

1. When #385 `check` SUCCESS + non-author APPROVED on `906c9ef7` (or later HEAD): protected merge; then request OWNER_GATE for staging RPC apply.
2. When #386 `check` SUCCESS + non-author APPROVED on `fe681543` (or later HEAD): protected merge.
3. Do not restack #317/#351/#347/#348/#352 without patch-compare: A2–A5 code/migrations already exist on current `main`.
4. A6 live PostgREST negatives after staging apply; A7 portal finance re-proof; E1 live AI smoke remains secret-gated.

## Commands

```sh
python3 scripts/ops/workspace_preflight.py --refresh --resume-pr 385
python3 scripts/ops/workspace_preflight.py --refresh --resume-pr 386
bun run --cwd packages/contracts build && bun run --cwd apps/web test -- app/api/v1/ai/analyze-video-daily/route.test.ts
# in vision worktree:
bun run --cwd apps/web test -- lib/domain/vision-jobs/create-vision-job.service.test.ts lib/api/engine.test.ts supabase/migrations/create-analysis-job-request-key.migration.test.ts
```
