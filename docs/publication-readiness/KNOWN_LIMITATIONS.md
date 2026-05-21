# Known Limitations

## Android status

- Android is **not** part of first release scope.
- Current classification: `BUILDABLE_SHELL`.
- Build passes do not equal product-readiness claim.

## iOS status

- iOS Worker/Manager simulator builds pass.
- Targeted runtime UITest smoke (worker login screen + manager login screen) is now proven.
- Full end-to-end worker submit and manager review transaction chain is still partial.

## Supabase external blocker

- Live migration parity cannot be confirmed in current environment without:
  - authenticated `supabase login/link`
  - `SUPABASE_DB_PASSWORD`
- `supabase migration list` / `supabase db push --dry-run` currently fail with 401 unauthorized in this sprint environment.

## Production buildStamp proof

- Closed: live production now returns `buildStamp.sha7` and `buildStamp.buildTime` after redeploy proof.

## Documents / costs / AI limitations

- Repo-level tests cover these modules, but live environment proof still depends on operator credentials and runtime smoke.
- AI provider full-path remains unstable/unproven in this run (`provider_unavailable`); graceful fallback is validated.

## Live smoke limitations

- Runtime pilot smoke is proven in production deploy workflow.
- Local strict smoke checks still fail in this shell unless required env vars and auth are supplied.
- Multi-locale route and contact API live probes are verified, but full browser visual/content QA remains partial.

## System health guard limitations

- Deny-path protection (`no key` / `wrong key`) is proven live.
- Allow-path proof with real `X-System-Key` remains external in this shell (missing key).

## Browser visual QA limitations

- Live locale routes and contact API are healthy.
- Full browser-render visual QA (leftover-language scan, nav clicks, responsive checks, favicon/logo sanity) still requires manual operator execution.

