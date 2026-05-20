# Known Limitations

## Android status

- Android is **not** part of first release scope.
- Current classification: `BUILDABLE_SHELL`.
- Build passes do not equal product-readiness claim.

## iOS status

- iOS Worker/Manager simulator builds pass.
- Full runtime smoke evidence is still pending for final pilot-ready claim.

## Supabase external blocker

- Live migration parity cannot be confirmed in current environment without:
  - authenticated `supabase login/link`
  - `SUPABASE_DB_PASSWORD`
- `supabase migration list` / `supabase db push --dry-run` currently fail with 401 unauthorized in this sprint environment.

## Production buildStamp proof

- Post-redeploy live confirmation of `buildStamp.sha7` + `buildTime` on deployed health endpoint remains required to close deploy-truth proof.

## Documents / costs / AI limitations

- Repo-level tests cover these modules, but live environment proof still depends on operator credentials and runtime smoke.
- AI provider live behavior remains key-dependent; fallback behavior is validated.

## Live smoke limitations

- Strict pilot smoke checks fail in current shell unless required env vars and auth are supplied.
- Multi-locale public visual crawl/contact runtime verification is still pending a dedicated live run.

