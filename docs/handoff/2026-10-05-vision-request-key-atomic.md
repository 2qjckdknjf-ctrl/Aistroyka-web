# Handoff — vision request_key atomic + Customer portal detail

Date: 2026-10-05. Working folder: `/Users/alex/Projects/AISTROYKA-vision-request-key`.

## Done this session

- Workspace preflight on `AISTROYKA-main-clean`: `CURRENT_BASELINE` at `2c44b530` (then `origin/main` advanced).
- [#381](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/381)/[#383](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/383)/[#384](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/384) remain merged.
- [#382](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/382) merged at `ee162ea4` (non-author APPROVED on `17ae3a08`, required `check` SUCCESS). Device smoke for Customer estimates/requests: `DEVICE_SMOKE_PARTIAL` (no dedicated staging persona in this session).
- [#385](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/385) continued: Codex P1s already fixed in `2a0df51e` (re-read after lost bind; re-raise mismatched keys). Threads resolved. Branch merged with post-#382 `origin/main`.

## Live evidence (2026-10-05)

| Surface | Result |
|---|---|
| Production health | `ok`, `buildStamp.sha7=2c44b53` — **not yet** `ee162ea` |
| Staging health | `ok`, `buildStamp.sha7=2c44b53` — staging deploy of #382 **not yet observed** |
| Live `create_analysis_job` | 3-arg only (`p_tenant_id, p_media_id, p_priority`) — #385 migration **not applied** |
| `analysis_jobs.request_key` | column present |
| `construction_graph_nodes` | present |
| `customer_intake_drafts` | **absent** — #378 code in main, table not live (`OWNER_GATE`) |

## Blocked

- Merge #385: `WAITING_FOR_NON_AUTHOR_APPROVAL`. `GITHUB_REVIEWER_TOKEN` returned 401; gh keyring is only `2qjckdknjf-ctrl`. Do not self-approve.
- Apply `20261004180000_create_analysis_job_request_key.sql` and `20261003170000_customer_intake_drafts.sql`: `OWNER_GATE` (staging-first).

## Next

1. Independent reviewer APPROVED on current #385 HEAD after `check` SUCCESS, then protected merge.
2. Staging-first apply of the request_key RPC; confirm `pg_get_function_identity_arguments` includes `p_request_key`.
3. Customer iOS device smoke for portal estimates/requests against staging.
4. Do not reimplement open #351/#347/#348/#352/#317 until patch-compared with main (A2/A3 migrations and A4/A5 submitted-report visibility already exist in current main).
