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
- iOS runtime smoke is partially closed (targeted login-screen UITest evidence); full transaction chain remains pending.
- Full browser-level visual locale QA remains manual and is not fully closed by HTTP probes alone.

## Supported platforms (first release scope)

- Web (public + dashboard)
- iOS pilot (controlled/TestFlight path with checklist completion)

## Unsupported / deferred platforms

- Android (deferred; classified `BUILDABLE_SHELL`, not production-ready)

## Support path

- Use project support/ops channel with:
  - tenant id
  - project id
  - user role
  - timestamp
  - route/screen
  - error message/request id

