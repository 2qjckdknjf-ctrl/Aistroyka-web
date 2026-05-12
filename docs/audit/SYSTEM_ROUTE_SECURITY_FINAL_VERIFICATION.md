# System Route Security Final Verification

## Inspected files

- `apps/web/lib/system/system-route-auth.ts`
- `apps/web/lib/system/system-route-auth.test.ts`
- `apps/web/app/api/system/health/route.ts`
- `apps/web/app/api/v1/system/health/route.ts`

## Commands run (2026-05-08)

- `curl -i "https://staging.aistroyka.ai/api/v1/system/health"`
- `curl -i "https://aistroyka.ai/api/v1/system/health"`
- `curl -i "https://aistroyka.ai/api/system/health"`
- Environment presence check: `SYSTEM_API_KEY` in operator shell typically **UNSET** during doc runs

## Result

| Check | Outcome |
|-------|---------|
| Staging unauthenticated v1 | **503** JSON `system_routes_require_auth` |
| Production unauthenticated v1 | **401** JSON `X-System-Key required` |
| Production legacy `/api/system/health` | **401** JSON `X-System-Key required` |
| Secret leakage in sampled bodies | **None** observed |

## Proof summary

- Policy responses match guard intent: **do not** return system health JSON without key when key is required.
- Staging returns **503** when deployment treats system routes as unavailable without configured production key — still a **controlled** JSON shape.

## Changes made

- Documentation refresh only (no route weakening).

## Remaining blockers

- **Positive verification** with a valid `SYSTEM_API_KEY` header (operator action).
- Repo secret inventory may not list `SYSTEM_API_KEY`; ensure production/staging env parity with product expectations.

## Final verdict

**PASS** for **sampled unauthenticated** live checks (2026-05-08). **BLOCKED** for full positive-key proof without operator key material.
