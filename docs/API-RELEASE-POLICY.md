# API release and deprecation policy

- **v1 is stable.** All endpoints under `/api/v1/` are subject to additive-only changes; no breaking changes without a new version.
- **Breaking changes require v2.** Any change that removes or renames request/response fields, or changes semantics, must be introduced under `/api/v2/` (or a new major version). Do not implement v2 until required.
- **Legacy endpoints** (e.g. `/api/tenant/*`, `/api/projects`, `/api/health` without the `/api/v1` prefix) are deprecated. Responses include:
  - `Deprecation: true`
  - `Sunset: <date>` (date after which the endpoint may be removed)
  - `Link: </api/v1/...>; rel="successor"` where a v1 equivalent exists
- **No breaking changes to existing v1 contracts.** New optional fields and new endpoints are allowed.
- **Security and compatibility.** Fixes for security or critical bugs may change behavior only when documented; prefer additive mitigations.
