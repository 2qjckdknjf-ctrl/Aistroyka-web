# STAGE 4 — Blocker resolution: authenticated smoke + runtime pilot prep

**Scope:** Resolve P0 documentation and clarity for (1) green `pilot_launch.sh` with `ops/metrics` **200**, and (2) minimum prerequisites for manual runtime pilot on Android + iOS.  
**Does not:** claim STAGE 4 closed, invent PASS results, or start STAGE 5.

---

## A. Authenticated smoke — auth path truth

### Supported paths in `scripts/smoke/pilot_launch.sh`

| Path | Mechanism | When it runs |
|------|-----------|----------------|
| **`AUTH_HEADER`** | Exported before invoking the script. Passed as curl `-H "Authorization: $AUTH_HEADER"`. Value must be the **full** header value: `Bearer <access_token>` (script does not add `Bearer` for you). | Highest precedence for metrics if set in environment. |
| **`COOKIE`** | Full `Cookie:` header value from a **logged-in browser session** on the same app host as `BASE_URL`. | Used when `AUTH_HEADER` is unset; curl sends `-H "Cookie: $COOKIE"`. |
| **`SMOKE_EMAIL` + `SMOKE_PASSWORD`** | Only if **both** `AUTH_HEADER` and `COOKIE` are **unset**. Script POSTs to Supabase `auth/v1/token?grant_type=password` and sets `AUTH` from JSON `.access_token`. | Requires Supabase project URL + anon key (see below). |

### Required environment variables (by path)

**Always (script):**

- `BASE_URL` — e.g. `https://aistroyka.ai` (no trailing slash issues handled by API paths).

**Password-grant branch (optional auto-token):**

- `SMOKE_EMAIL`, `SMOKE_PASSWORD`
- `SUPABASE_URL` **or** `NEXT_PUBLIC_SUPABASE_URL` — must be the **same Supabase project** the web app uses (same as Vercel / `apps/web`).
- `SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **anon** key only (not service role).

**Cron (only if production requires secret):**

- `CRON_SECRET` — if the server returns **403** on cron-tick without secret, set this to match `x-cron-secret` expectations.

### What token class `ops/metrics` requires (proof from code)

`GET /api/v1/ops/metrics` uses `createClientFromRequest` (`apps/web/lib/supabase/server.ts`):

1. If `Authorization: Bearer <token>` is present, the server builds a Supabase client with that **JWT** and calls `supabase.auth.getUser()`.
2. **Service role** JWTs are **rejected** (403 / forbidden path), not user metrics.
3. The user must resolve to a real Supabase user **and** have **tenant membership** (`tenant_members` or owner tenant) or `requireTenant` yields **401** / **403** (`apps/web/app/api/v1/ops/metrics/route.ts`, `apps/web/lib/tenant/tenant.context.ts`).

Therefore the metrics check requires a **Supabase Auth user `access_token` (JWT)** issued for that project — typically from password sign-in, OAuth, or magic link — **not** arbitrary API keys or CLI tokens.

### Why the prior 44-character token failed

`SUPABASE_ACCESS_TOKEN` in local env was **44 characters**. A Supabase **user JWT** is normally a long string with **three dot-separated segments** (header.payload.signature), on the order of **hundreds of characters**. Short tokens are consistent with **Supabase CLI personal access tokens** or other **non-JWT** credentials. Sending a non-JWT or invalid token results in no valid user → tenant context cannot be established → **`ops/metrics` returns 401**.

### Exact operator commands for `ops/metrics` **200** (choose one)

**1) Email/password (same project as production)** — no token in shell history if you use env file:

```bash
cd /path/to/AISTROYKA
export BASE_URL='https://aistroyka.ai'
export SMOKE_EMAIL='your-pilot-user@example.com'
export SMOKE_PASSWORD='***'
export NEXT_PUBLIC_SUPABASE_URL='https://<project>.supabase.co'
export NEXT_PUBLIC_SUPABASE_ANON_KEY='<anon-key>'
./scripts/smoke/pilot_launch.sh
```

Requirements: user exists in Supabase Auth, password correct, user has **tenant membership** in the DB for that deployment.

**2) Explicit Bearer (after any sign-in that returns `access_token`)**

```bash
export BASE_URL='https://aistroyka.ai'
export AUTH_HEADER="Bearer <paste_supabase_access_token_jwt>"
./scripts/smoke/pilot_launch.sh
```

**How to obtain a valid JWT manually**

- **Dashboard login:** Sign in at `BASE_URL` in a browser; in DevTools → Application → Cookies (or storage used by Supabase SSR), find the session for your project; or use the Supabase client’s session from a **logged-in** context. For curl, copy the **`access_token`** from the session (JWT), or copy the full **`Cookie`** header for authenticated requests to the **same origin** as `BASE_URL`.
- **Password API:** `POST ${SUPABASE_URL}/auth/v1/token?grant_type=password` with `apikey: <anon key>` and JSON `email`/`password` — use `.access_token` from the JSON response (same as script’s internal path).
- **One-time bootstrap user (admin only):** `node scripts/smoke/bootstrap_smoke_user.mjs` requires `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BASE_URL` — creates/links a user and runs `pilot_launch` with a fresh token (see script header). **Not** for routine use if you already have pilot users.

**3) Cookie session**

```bash
export BASE_URL='https://aistroyka.ai'
export COOKIE='sb-xxxxx-auth-token=...; ...'   # full Cookie string from browser after login
./scripts/smoke/pilot_launch.sh
```

### `tenant_members` RLS infinite recursion (Postgres `42P17`)

If REST or the app returns **500** / fails to load memberships with user JWT, or metrics stays **403** despite a `tenant_members` row, check for **infinite recursion** on `tenant_members` SELECT policies (policy subselects the same table).

**Repo fix:** `apps/web/supabase/migrations/20260323110000_tenant_members_rls_break_recursion.sql` — function `current_user_tenant_ids()` + updated `tenant_members_select_own` policy. **Apply to remote** (CLI `db push`, Dashboard SQL, or MCP `apply_migration`) so production matches repo.

---

### Tenant membership (`User has no tenant membership` / HTTP 403 on `ops/metrics`)

**Model (repo):** `public.tenants` (workspace); `public.tenant_members` (`tenant_id`, `user_id`, `role` in `owner|admin|member|viewer`). Tenant context also allows **`tenants.user_id`** = owner without a `tenant_members` row (see `apps/web/lib/tenant/tenant.context.ts`). API `GET /api/v1/ops/metrics` requires a resolved **tenant** for the user.

**Pilot tenant id (same as bootstrap):** `6414f756-aa54-48f5-91e2-f852a7c1e837` (see `scripts/smoke/bootstrap_smoke_user.mjs`). Override with **`PILOT_TENANT_ID`** if your prod default differs.

**A) Script (needs service role — never commit):** add **`SUPABASE_SERVICE_ROLE_KEY`** to **root** `.env.local` (gitignored), keep **`SMOKE_EMAIL`**, then:

```bash
set -a && source .env.local && set +a && node scripts/smoke/attach_smoke_user_tenant.mjs
```

Then rerun `pilot_launch.sh`.

**B) SQL (Supabase SQL Editor, postgres role):** resolve `user_id` from `auth.users` by email, then:

```sql
insert into public.tenant_members (tenant_id, user_id, role)
values ('6414f756-aa54-48f5-91e2-f852a7c1e837', '<auth_user_uuid>', 'admin')
on conflict (tenant_id, user_id) do nothing;
```

---

## B. Runtime pilot prep — narrow checklist

### Android

| Requirement | Detail |
|-------------|--------|
| **Device or emulator** | Physical device (USB + USB debugging) **or** Android Emulator (AVD). Install platform-tools; `adb devices` must list one device. |
| **Build / install** | From `android/`: `./gradlew :AiStroykaWorker:assembleDebug` / `:AiStroykaManager:assembleDebug`; install APK with `adb install -r …` or Run from Android Studio. |
| **Config** | `AppRuntime` is filled from **BuildConfig** (`WorkerApplication` / Manager): `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` in app `build.gradle.kts` / signing configs — align with pilot host (e.g. `https://aistroyka.ai`) and the **same** Supabase project as web. |
| **Accounts** | Worker: user with worker/task access in target tenant. Manager: user with manager role (owner/admin/member per API — not viewer-only if review is required). |

### iOS

| Requirement | Detail |
|-------------|--------|
| **Simulator or device** | Xcode **Simulator** (e.g. iPhone 15) or physical device with provisioning. |
| **Build** | Open `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` or Manager project; set scheme; **Debug** build to simulator. |
| **Config** | `ios/Config/Secrets.xcconfig` (from `Secrets.xcconfig.example`): `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` — same pilot host and Supabase project as Android/web. |
| **Accounts** | Same class as Android: Worker login for Worker app; Manager-capable login for Manager app. |

### Accounts (both platforms)

- At least **one Worker**-eligible user (can see assigned tasks / projects for the pilot).
- At least **one Manager**-eligible user (can open reports inbox and perform **one** review: approve / request changes / etc., per STAGE 4 matrix).
- Users must exist in **Supabase Auth** and be linked to the **same tenant** as production pilot data.

### Data required (minimum)

- **Tenant** with at least **one project** and **one task** assigned to the Worker user (Worker contour).
- For Manager contour: at least **one report** in **submitted/pending review** state (or create from Worker, then review on Manager).
- Cross-platform checks: record **report ID** from Worker submission and confirm visibility + **review state** on the other Manager surface and optionally web dashboard.

### Evidence to capture (operator)

- Report UUID(s), UTC timestamps, review action and final status, optional screenshots (paths external to repo OK).
- After auth works: `pilot_launch.sh` **exit 0** log with `PASS: ops/metrics`.

---

## C. Relation to STAGE 4 docs

- Detailed run history: `STAGE4_PILOT_VALIDATION_REPORT.md`
- Matrix: `STAGE4_CROSS_PLATFORM_TRUTH_MATRIX.md`
- Decision: `STAGE4_POST_AUDIT.md`

This file is the **operator-facing** resolution guide for auth + prep only.
