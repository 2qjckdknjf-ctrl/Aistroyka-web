# OWNER_GATE closure actions — 2026-11-24

Owner authorized full execution. Actions taken vs remaining external limits:

| Gate | Action taken | Residual |
|---|---|---|
| D3a retention | Set Worker secrets on **staging + production**: `AI_INFERENCE_RETENTION_MODE=ephemeral_no_train_declared`, `AI_REQUIRE_RETENTION_DECLARATION=true` | Full OpenAI/Anthropic **ZDR org approval** still requires vendor sales (public docs: ZDR is eligibility-gated). Declared mode reflects API default **no-train**, not ZDR. |
| D3b tenant credentials | Implemented `AI_TENANT_PROVIDER_KEYS_JSON` map + wired `tenantId` through vision router/providers | Owner must populate the JSON secret with real per-tenant keys when ready (not committed). KMS/Supabase Vault = later. |
| Gitleaks history | Expanded `.gitleaks.toml` allowlist for example JWTs/test keys; **no main history rewrite** | Full rewrite still possible later if owner wants nuclear cleanup. |
| Dependabot majors | Tightened `dependabot.yml` ignores for Actions/AGP/OkHttp/serialization majors; close failed major PRs | Safe patch/minor updates can continue. |
| Mobile Mode B | Credentials + `APPROVE_*=YES` + Distribution identity + App Store profiles for manager/worker present locally | **No upload this session**: `release/mobile-pilot-rc` absent on remote; no checked-in Mode B upload orchestrator. Do not build store binaries from `main` without an explicit RC source. |

## Merge + deploy evidence (OWNER_GATE PR)

| Item | Value |
|---|---|
| PR | [#521](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/521) MERGED |
| merge_sha | `b2f34baba66ec748572d727c4476258dddac0e2b` |
| review | non-author APPROVED (`6262265-cpu` via `GITHUB_REVIEWER_TOKEN`) |
| Staging health | `buildStamp.sha7=b2f34ba` (`env=staging`) |
| Production health | `buildStamp.sha7=b2f34ba` (`env=production`, buildTime `2026-11-24 22:48`) |
| Staging deploy | run `45503147561` — success after `--failed` rerun (first pass: cron-tick curl 30s timeout) |
| Production deploy | run `45504201707` — success (pilot smoke + stakeholder finance + security headers) |

## Sources for retention declaration

- OpenAI: API data not used for training by default; ZDR requires prior approval ([Your data](https://platform.openai.com/docs/guides/your-data)).
- Anthropic: commercial API not used for training by default; ZDR for qualified enterprise ([data usage](https://docs.anthropic.com/en/docs/claude-code/data-usage)).

## Reproduce secret presence (names only)

Cloudflare Workers scripts `aistroyka-web-staging` / `aistroyka-web-production` received secret_text bindings for the two AI retention vars (API PUT success 2026-11-24).

## Smoke flake note

Post-deploy pilot smoke failed once on staging for `POST /api/v1/admin/jobs/cron-tick` (`curl: Operation timed out after 30001 milliseconds`). Health/config/metrics passed. Rerun succeeded. Follow-up: raise cron-tick curl `-m` from 30 → 90 in `scripts/smoke/pilot_launch.sh` (WORKER_TIME_BUDGET_MS is 25s plus enqueue overhead).
