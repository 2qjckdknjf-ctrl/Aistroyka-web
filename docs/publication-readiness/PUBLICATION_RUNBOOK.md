# Publication Runbook

## 1. Scope of this runbook

First release scope (truthful as of Stage 17):

- Web public site + web dashboard + API (`/api/v1/*`)
- iOS Worker/Manager in controlled pilot path (not broad public claim yet)
- Android excluded from first release scope

## 2. Deployment steps (Cloudflare/OpenNext)

From repository root:

```bash
bun install
bun run build
bun run cf:build
```

Deploy from `apps/web`:

```bash
bun run cf:deploy:staging
# or production path when change window approved
bun run cf:deploy:prod
```

## 3. Health verification

After deploy:

```bash
curl -sS https://<host>/api/v1/health
curl -sS https://<host>/api/v1/system/health -H "X-System-Key: <SYSTEM_KEY>"
```

Required checks:

1. HTTP 200 on both endpoints.
2. `buildStamp.sha7` and `buildTime` present and matching deployed commit.
3. No system route access without correct system key.

Current evidence snapshot:

- BuildStamp proof: closed in live production (`LIVE_BUILDSTAMP_VERIFICATION_REPORT.md`).
- System guard deny-path: closed; allow-path with real key still requires operator-local key execution.

## 4. Smoke verification

Syntax gate:

```bash
bash -n scripts/smoke/pilot_launch.sh
bash -n scripts/smoke/check_pilot_prereqs.sh
```

Prereq gate:

```bash
bun run smoke:pilot:check --strict
```

Run pilot smoke when prereqs pass:

```bash
bun run smoke:pilot
```

Current evidence snapshot:

- Blocking post-deploy pilot smoke job is passing in production workflow.
- Local strict prereq command is still environment-dependent.

## 5. DB migration verification

From `apps/web`:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
export SUPABASE_DB_PASSWORD='<DB_PASSWORD>'
supabase migration list
supabase db push --dry-run
```

If unauthorized/401 appears, stop and restore credentials/link before publication claim.

## 6. Login and dashboard verification

Minimum post-deploy checks:

1. Manager login works on target host.
2. Worker login works on target host.
3. Dashboard first-use empty-state CTAs are visible.
4. Report review path (approve/reject/request changes) works.
5. Documents and costs pages load for authorized tenant users.

## 7. iOS pilot verification

Build checks:

```bash
xcodebuild -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -scheme AiStroykaManager -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
```

Runtime checks must follow:

- `docs/publication-readiness/IOS_TESTFLIGHT_READINESS_CHECKLIST.md`
- `docs/publication-readiness/IOS_RUNTIME_SMOKE_REPORT.md`

## 8. Android exclusion/deferred policy

- Android classification is `BUILDABLE_SHELL`.
- Do not include Android in launch announcement, onboarding promises, or support matrix.

## 9. Rollback path

1. Re-deploy previous known-good Cloudflare build.
2. Re-verify `/api/v1/health` + `/api/v1/system/health`.
3. Run minimal login/dashboard smoke.
4. Announce incident + rollback summary in ops channel/change log.

## 10. Support and troubleshooting

Priority incidents:

1. Auth failures / tenant isolation regression.
2. Worker report submission pipeline failures.
3. Manager review queue failures.
4. Cloudflare deploy drift (`buildStamp` mismatch).
5. Supabase migration/auth parity drift.

