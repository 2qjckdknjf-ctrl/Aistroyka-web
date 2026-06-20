# API Draft PR Attempt — 2026-06-20

## Token Env Check
- `GITHUB_TOKEN`: absent
- `GH_TOKEN`: absent
- Other `GITHUB*` / `GH_*` env names: none found

## API Fallback Used
- NO.

## Reason
- No GitHub token was available in the environment.
- Without a token, the GitHub REST API cannot create a PR.

## Result
- Draft PR not created by API.

## Manual PR URL
`https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/new/integration/aistroyka-full-reconciliation-2026-06-20`
