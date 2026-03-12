# Auth pattern audit

**Branch:** hardening/dashboard-auth-middleware-sweep  
**Scope:** apps/web (excl. audit_* artifacts)

## Standard: safe auth access

- **getUser():**
  - Safe: `const res = await supabase.auth.getUser(); const user = res?.data?.user ?? null;` inside try/catch, or use `getSessionUser(supabase)` from `@/lib/supabase/server`.
  - Unsafe: `const { data: { user } } = await supabase.auth.getUser();` (throws when `data` is null/undefined).
- **getSession():**
  - Safe: `const res = await supabase.auth.getSession(); const session = res?.data?.session ?? null;` inside try/catch, or use `safeGetSession(supabase)`.
  - Unsafe: `const { data: { session } } = await supabase.auth.getSession();`

## Findings (auth-critical paths)

| File | Line | Pattern | Risk | Fixed |
|------|------|---------|------|-------|
| lib/supabase/middleware.ts | 66–67 | Safe: res?.data?.user ?? null + try/catch | — | Yes (previous fix) |
| lib/supabase/server.ts | getSessionUser | Safe helper | — | Yes |
| app/[locale]/(dashboard)/layout.tsx | — | Uses getSessionUser | — | Yes |
| app/[locale]/(dashboard)/dashboard/page.tsx | — | Uses getSessionUser | — | Yes |
| lib/tenant/tenant.context.ts | 44–45 | Safe: res?.data?.user ?? null + try/catch | — | Yes |
| src/features/admin/auth/requireAdmin.ts | 24–25 | Safe: res?.data?.user ?? null + try/catch | — | Yes |
| lib/api/engine.ts | 30 | Safe: res?.data?.user ?? null + try | — | Yes |
| lib/supabase/rpc.ts | 18–19, 44–45, 100–101 | getSessionUser(supabase) | — | Yes |
| lib/auth/admin.ts | 26 | getSessionUser(supabase) | — | Yes |
| lib/auth/tenant.ts | 36 | getSessionUser(supabase) | — | Yes |
| lib/domain/tenants/tenant.service.ts | 14 | getSessionUser(supabase) | — | Yes |
| app/[locale]/page.tsx | 10 | getSessionUser(supabase) | — | Yes |
| app/[locale]/(dashboard)/team/page.tsx | 14 | getSessionUser(supabase) | — | Yes |
| app/[locale]/(dashboard)/portfolio/page.tsx | 17 | getSessionUser(supabase) | — | Yes |
| app/[locale]/(dashboard)/projects/[id]/page.tsx | 44 | getSessionUser(supabase) | — | Yes |
| app/[locale]/(dashboard)/projects/[id]/ai/page.tsx | 16 | getSessionUser(supabase) | — | Yes |
| app/api/tenant/* (accept-invite, revoke, invitations) | — | getSessionUser(supabase) | — | Yes |
| app/api/projects/[id]/upload/route.ts | 44 | getSessionUser(supabase) | — | Yes |
| app/api/projects/[id]/poll-status/route.ts | 19 | getSessionUser(supabase) | — | Yes |
| app/api/analysis/process/route.ts | 21 | getSessionUser(supabase) | — | Yes |
| app/api/v1/org/tenants/route.ts | 15 | getSessionUser(supabase) | — | Yes |
| app/api/v1/org/metrics/overview/route.ts | 14 | getSessionUser(supabase) | — | Yes |
| app/api/_debug/auth/route.ts | 43 | createClient + getSessionUser | — | Yes |
| components/ai/AiActionPanel.tsx | 80 | Safe res?.data?.session + try/catch | — | Yes |
| lib/features/ai/components/CopilotChatPanel.tsx | 76, 82 | Safe res?.data?.session + try/catch | — | Yes |
| lib/features/ai/api/useCopilotThread.ts | 40, 63, 111 | Safe res?.data?.session + try/catch | — | Yes |
| app/[locale]/invite/accept/page.tsx | 25 | res?.data?.session ?? null | — | Yes |
| src/features/admin/ai/api/* | getSession/getUser | Safe res?.data + try/catch | — | Yes |

## Fix strategy

1. **Server/API:** Use `getSessionUser(supabase)` from `@/lib/supabase/server` (already never throws). Add `safeGetSession(supabase)` where only token/session is needed.
2. **Server pages/layouts:** Use `getSessionUser`; already done for dashboard layout and dashboard page.
3. **Client components/hooks:** Use `const res = await supabase.auth.getSession(); const session = res?.data?.session ?? null;` (and same for getUser) inside try/catch where used.
4. **audit_* artifacts:** Leave unchanged (legacy/backup copies).

## Status key

- **Yes** = fixed before or in this sweep.
- **Fix** = to be fixed in this branch.
