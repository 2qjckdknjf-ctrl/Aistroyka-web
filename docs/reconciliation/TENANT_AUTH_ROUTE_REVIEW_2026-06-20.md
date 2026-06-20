# Tenant / Auth Route Review — 2026-06-20

## Scope
Read-only review of tenant/auth-sensitive backend/API deltas outside main.

## Risks

| File/route | Current main behavior | Outside-main behavior | Risk | Data exposure risk | Auth break risk | Recommended action |
|---|---|---|---|---|---|---|
| `apps/web/app/api/tenant/members/route.ts` | Legacy route implements tenant context, membership requirement, `tenant:invite` authorization, returns tenant members | `chore/phase13-operator-refresh` redirects to `/api/v1/tenant/members` | P0/P1 | Medium: members list is tenant-sensitive | High if legacy callers expect current response/status semantics | `manual_review_again`; compare v1 semantics and callers first |
| `apps/web/middleware.ts` | Main applies lite allow-list to `/api/v1`, handles owner API exception, applies page security headers, matcher includes non-API + `/api/v1/:path*` | hotfix/security branches alter matcher and API security header handling | P0 | Medium through route protection mistakes | High: login/dashboard/API can break | Do not port in backend/API phase; separate middleware phase only |
| `/api/v1/tenant/ai-training-consent` | Not present in main | AI branches add training consent route backed by new tenant column | P0/P1 | High: tenant consent controls AI data use | Medium/high if exposed to wrong role | Blocked by AI migration/RBAC review |
| `/api/v1/tenant/ai-expert-review-queue/*` | Not present in main | AI branches add internal admin queue routes | P0 | High: internal AI review data | High if admin/tenant guard insufficient | Blocked by migration/admin RBAC review |
| `apps/web/lib/supabase/middleware.ts` | `updateSession` returns session response and user | `release/mobile-pilot-rc` returns `supabase` client too | P1 | Low directly, but session handling is sensitive | Medium if middleware consumers change assumptions | Review only if report/mobile changes require it |
| `apps/web/lib/api/lite-allow-list.ts` | Allows selected `/api/v1` paths for iOS/Android lite clients; blocks AI/internal paths | No direct candidate change in this phase | P1 guardrail | High if loosened | High for mobile clients | Keep main behavior; validate any new mobile route against allow-list |
| `/api/auth/*` | Intentional auth surface outside `/api/v1` | No approved change | P0 if altered | High | High | Do not canonicalize to `/api/v1` |

## P0 Risks
- Middleware matcher/header rewrites.
- Legacy tenant members redirect without caller/semantic review.
- AI tenant/admin routes without migrations and RBAC.

## P1 Risks
- Mobile/report side effects changing session/sync/notification behavior.
- New export routes returning tenant data without customer finance and tenant scope checks.
- Any new route expected by frontend/mobile but absent from main.

## Verdict
- Safe now: none.
- Manual review: tenant members canonicalization, export/report routes, report review side effects.
- Blocked: AI consent/queue routes and middleware behavior changes.
