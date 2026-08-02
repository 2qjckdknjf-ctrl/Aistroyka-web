# User Release Notes (Pilot Track)

## What is ready

- Web public site and web dashboard core flows
- Tenant-aware auth and API v1 surface
- Worker report pipeline and manager review governance (repo-validated)
- Documents and costs manager workflows (repo-validated)
- iOS Worker/Manager simulator builds

## Beta limitations

- Live Supabase migration parity proof is still operator-dependent.
- Local strict smoke prereq checks require environment credentials (runtime pipeline smoke is passing).
- AI provider full path depends on runtime availability; deterministic fallback is currently active and validated.
- AI behavior is released under degraded/beta policy until provider-backed closure (`docs/publication-readiness/AI_DEGRADED_MODE_POLICY.md`).
- Phase 7 (2026-07-30): paid AI routes require auth; anonymous paid vision is closed. Fail-closed rate-limit controls require live RPC `rate_limit_try_increment_multi` (migration `20260725190000_rate_limit_try_increment.sql` — not applied in this phase). Until that operator apply, local/source paid provider path stays disabled and vision may return explicit deterministic fallback (`X-AI-Fallback-Reason: rate_limit_unavailable`). Public Copilot page mock UI is simulation-only. Do not claim Level 4 / production-ready Copilot / multi-provider failover from configuration alone.
- Stakeholder finance live sanity gate is still open because current production smoke credentials resolve to an internal admin role, not a dedicated stakeholder test user.
- iOS runtime smoke is partially closed (targeted login-screen UITest evidence); full transaction chain remains pending.
- Full browser-level visual locale QA remains manual and is not fully closed by HTTP probes alone.

## Supported platforms (first release scope)

- Web (public + dashboard)
- iOS pilot (controlled/TestFlight path with checklist completion)

## Unsupported / deferred platforms

- Android (deferred; classified `BUILDABLE_SHELL`, not production-ready)
- Deferred Android hardening scope is tracked in `docs/publication-readiness/ANDROID_HARDENING_BACKLOG.md`.

## Support path

- Use project support/ops channel with:
  - tenant id
  - project id
  - user role
  - timestamp
  - route/screen
  - error message/request id

