# User Release Notes (Pilot Track)

## What is ready

- Web public site and web dashboard core flows
- Tenant-aware auth and API v1 surface
- Worker report pipeline and manager review governance (repo-validated)
- Documents and costs manager workflows (repo-validated)
- iOS Worker/Manager simulator builds

## Beta limitations

- Live Supabase migration parity proof is still operator-dependent.
- Strict pilot smoke prereqs require environment credentials.
- AI provider live behavior depends on runtime keys; deterministic fallback is present.
- iOS runtime smoke is not fully closed with final pass artifact in this run.

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

