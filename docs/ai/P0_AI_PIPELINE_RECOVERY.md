# P0 — AI pipeline recovery (media resolve + provider + UI)

**Branch:** `fix/p0-ai-pipeline-recovery`  
**Base:** `origin/main`  
**Scope:** Restore `ai_analyze_media` processing and correct `/dashboard/ai` status display. No production data changes, no deploy, no migration apply.

## Root causes (code-confirmed)

1. **`Could not resolve image_url from media_id or upload_session_id`**
   - Resolver short-circuited on `media_id` with empty/missing `file_url` and never fell back to `upload_session_id`.
   - Pending upload was sometimes treated as permanent `JobPayloadError` → immediate `dead`.

2. **`All AI providers failed or are unavailable`**
   - Upload session URLs were built as `.../public/media/{object_path}` while `object_path` already starts with `media/`, producing `.../media/media/...`.
   - Public URLs against a private/ACL media bucket fail provider image fetch.
   - Provider exhaustion / missing keys were marked **non-retryable** (unless message contained `"timeout"`) → immediate `dead`.

3. **Dashboard showed «Нет AI-запросов»**
   - Default date filter used date-only `to=YYYY-MM-DD` with `lte(created_at, date)`, truncating the end day to midnight and hiding same-day jobs.
   - Empty copy did not consult unfiltered summary (failed/dead/queued), so filtered/truncated empty looked like “never created”.

## Fixes

- Unified resolver: `lib/platform/ai/resolve-ai-media-image.ts` (signed URL, tenant/project checks, cascade, typed codes).
- Handler uses retryable vs permanent codes (`AI_MEDIA_*`, `AI_PROVIDER_*`).
- `analyzeImage` distinguishes not-configured vs providers exhausted (retryable).
- `/api/v1/ai/requests` normalizes date bounds, returns `summary` + `vision_configured`, sanitizes errors.
- Dashboard AI UI distinguishes empty / filtered / pending / failed / not configured (RU/EN/ES/IT).

## Security follow-up (cross-tenant signed URL)

### Round 1 — poisoned `media.file_url`
- **Defect:** `resolveFromMediaId` trusted `media.tenant_id` then signed a path from `media.file_url` without verifying the object key belongs to that tenant.
- **Guard:** `lib/platform/ai/media-path-tenant-guard.ts` (+ ESM mirror, parity-tested).

### Round 2 — untrusted project UUID as authorization
- **Defect:** sync guard treated any UUID `projectId` as enough to authorize `${projectId}/...`, and the job handler fed raw `payload.project_id` into signing.
- **Rule:** UUID is not authorization. Project-prefixed legacy paths require DB proof:
  `projects.id = candidate AND projects.tenant_id = job.tenant_id` (fail closed).
- **Chokepoint:** `createSignedUrlForPath(supabase, path, { tenantId })` — no `projectId` argument.
  Tenant-prefixed paths authorize sync; project-prefixed paths call `verifyProjectBelongsToTenant` before `createSignedUrl`.
- **Handler:** `payload.project_id` is `projectIdClaim` only (mismatch detection). `analyzeImage` receives only `trustedProjectId`.
- Recovery proves project ownership the same way; foreign/missing/DB-error → never requeue.
- Migrations in-repo, **not applied**:
  - `20260806210000_media_file_url_immutable_for_clients.sql`
  - `20260807090000_jobs_payload_project_tenant_check.sql`

## Database / migrations

- Optional defense-in-depth migrations present in repo; **do not apply to production** without owner approval.
- Do **not** apply any migration to production for this PR.

## Recovery of existing dead jobs (dry-run first)

```bash
# Dry-run (default — no writes)
node scripts/ops/requeue-dead-ai-analyze-media.mjs --tenant-id=<TENANT_UUID>

# Actual requeue (owner-approved env only — NOT run by this PR)
node scripts/ops/requeue-dead-ai-analyze-media.mjs --tenant-id=<TENANT_UUID> --execute
```

Classifies jobs into:

- `recoverable` — media reference resolves and a vision provider key is present in the env used by the script
- `permanently_unrecoverable` — missing media/session/object or tenant mismatch
- `provider_configuration_blocked` — media OK but no vision provider configured in that env

**Actual `--execute` was not run by the agent.**

## Rollback notes

- Code-only change: revert the PR branch.
- If dead jobs were requeued via `--execute`, they return to `queued` with `attempts=0`; no rows are deleted.
