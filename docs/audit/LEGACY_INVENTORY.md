# LEGACY INVENTORY

**Audit date:** 2026-04-02  
Reviewed questionable, dated, or duplicate documentation. **Classification only**; moves recorded in `ARCHIVE_DECISION_LOG.md`.

**Post-move:** Items classified **ARCHIVE_CANDIDATE** for `docs/audit/live/` and `DEPLOY_*` / lockdown / prod health snapshot were moved to `archive/v1-pre-release-cleanup/docs/audit/` (see log). Links in `supabase-security-hardened-live.md` were updated to the archive paths.

| Path | Classification | Reason | Active replacement | Risk | Notes |
|------|----------------|--------|----------------------|------|-------|
| `docs/audit/live/*` | **ARCHIVE_CANDIDATE** | Timestamped operational snapshots (2026-03) | This audit’s `PLATFORM_*` + `CONTRADICTION_REGISTER` | Low | Superseded as “current truth” |
| `docs/audit/DEPLOY_MISMATCH_RCA.md` | **ARCHIVE_CANDIDATE** | Incident-specific deploy RCA | Platform audit + `DEPLOY_WORKFLOW` notes if needed | Low | Historical |
| `docs/audit/DEPLOY_PUSH_PLAN.md` | **ARCHIVE_CANDIDATE** | Dated push plan | Same | Low | |
| `docs/audit/DEPLOY_PUSH_LOG.md` | **ARCHIVE_CANDIDATE** | Dated log | Same | Low | |
| `docs/audit/DEPLOY_WORKFLOW_NOTES.md` | **ARCHIVE_CANDIDATE** | Notes | Same | Low | |
| `docs/audit/DEPLOY_OR_ROUTE_MISMATCH_RCA.md` | **ARCHIVE_CANDIDATE** | RCA | Same | Low | |
| `docs/audit/PRODUCTION_LOCKDOWN_COMPLETE_20260303185654.md` | **ARCHIVE_CANDIDATE** | Point-in-time lockdown report | Security posture still in Supabase; narrative here is historical | Low | |
| `docs/audit/PROD_HEALTH_VERIFICATION_20260303193258.txt` | **ARCHIVE_CANDIDATE** | Text snapshot | Live health checked in new audit | Low | |
| `docs/audit/supabase-security-hardened.md` | **LEGACY_ACTIVE_REFERENCE** | DB security narrative | `docs/ENVIRONMENT-VARIABLES.md` + migrations | Medium if lost | **Not moved** — still reference material |
| `docs/audit/supabase-security-hardened-live.md` | **LEGACY_ACTIVE_REFERENCE** | Live snapshot narrative | Same | Medium | **Not moved** |
| `docs/audit/supabase-security-scan.md` | **LEGACY_ACTIVE_REFERENCE** | Scan output | Same | Medium | **Not moved** |
| `docs/audit/supabase-security-fixes.sql` | **DO_NOT_TOUCH** | SQL artifact | Migrations / DBA process | High | **Not moved** |
| `docs/audit/live/MANUAL_SNAPSHOT_AND_VALIDATION.sql` | **ARCHIVE_CANDIDATE** (with `live/`) | SQL snapshot | DBA-owned processes | Medium | Moves with `live/` |
| `docs/release-audit/*` | **STALE_DOC** / **LEGACY_ACTIVE_REFERENCE** | Pre-dates Android apps; WorkerLite language | This audit + code | Medium | **Not moved** — broad set; founder may still reference |
| `docs/release-hardening/IOS_RENAME_COMPLETION_PLAN.md` | **STALE_DOC** | WorkerLite rename | Current `ios/AiStroykaWorker` tree | Low | Align or archive in a future pass |
| `docs/launch/STAGE4_*.md` | **ACTIVE** | Pilot evidence | Same | Low | **Do not archive** — operational truth inputs |
| `docs/ENVIRONMENT-VARIABLES.md` | **ACTIVE** | Env governance | Same | High | **DO_NOT_TOUCH** |
