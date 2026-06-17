# Legacy API surface inventory (H-05)

**Date:** 2026-06-16  
**Canonical prefix:** `/api/v1/*`  
**Policy:** Legacy routes under `/api/*` (excluding `/api/v1`, `/api/auth`, `/api/_debug`) remain for backward compatibility with deprecation headers (`Deprecation`, `Sunset`, `Link: rel=successor`) or thin re-exports. New clients must use `/api/v1`.

## Redirect-only (307 → `/api/v1/...`)

| Legacy path | Successor |
|-------------|-----------|
| `/api/activation/status` | `/api/v1/activation/status` |
| `/api/tenant/accept-invite` | `/api/v1/tenant/accept-invite` |
| `/api/tenant/invitations` | `/api/v1/tenant/invitations` |
| `/api/tenant/invite` | `/api/v1/tenant/invite` |
| `/api/tenant/profile` | `/api/v1/tenant/profile` |
| `/api/tenant/revoke` | `/api/v1/tenant/revoke` |
| `/api/tenant/members` | `/api/v1/tenant/members` (2026-06-16) |

Implementation: `apps/web/lib/api/legacy-redirect.ts` (`redirectToV1PreservePath`).

## Re-export (same handler as v1)

| Legacy path | Notes |
|-------------|-------|
| `/api/ai/transcribe` | `export` from `v1/ai/transcribe` |
| `/api/webhooks/incoming` | `export` from `v1/webhooks/incoming` |
| `/api/v1/projects` | Re-exports `GET`/`POST` from `/api/projects` (implementation still in legacy file) |

## Delegate + deprecation headers (shared controller)

| Legacy path | Successor | Notes |
|-------------|-----------|-------|
| `/api/health` | `/api/v1/health` | `getHealthResponse()` |
| `/api/system/health` | `/api/v1/system/health` | shared health |
| `/api/system/metrics` | `/api/v1/system/metrics` | ops metrics |

## Active legacy implementations (dashboard / mobile still call)

| Path prefix | Used by | Migration note |
|-------------|---------|----------------|
| `/api/projects` (+ `[id]`, upload, poll-status, media trigger) | Dashboard React forms (`CreateProjectForm`, `UploadMediaForm`, `TriggerAnalysisButton`, `JobListPolling`) | Prefer migrating UI fetch to `/api/v1/projects/*`; v1 list/create already aliases legacy handlers |
| `/api/ai/analyze-image`, `/api/ai/analyze-video-daily` | AI smoke + older clients | v1 twins exist under `/api/v1/ai/*` |
| `/api/analysis/process` | Analysis pipeline | v1: `/api/v1/analysis/process` |
| `/api/contact` | Public contact form | No v1 twin required for pilot |
| `/api/invite` | Invite flow | Check v1 stakeholder-invites |
| `/api/diag/supabase` | Diagnostics | Non-production / operator only |
| `/api/health/auth` | Auth health probe | Operator |

## Exit criteria (H-05)

1. Dashboard fetches use `/api/v1` for projects/media/poll-status.
2. Legacy routes either redirect, re-export, or are removed after sunset date (`2026-06-01` in `deprecation-headers.ts` — review before hard removal).
3. Mobile lite clients already restricted to allow-list (`apps/web/lib/api/lite-allow-list.ts`).

## References

- `apps/web/lib/api/deprecation-headers.ts`
- `docs/audit/DEEP_AUDIT_RISK_REGISTER.md` (H-05)
- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`
