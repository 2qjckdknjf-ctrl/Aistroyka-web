# Owner evidence recovery audit — 2026-10-11

Baseline main0bc5d602. Existing source:open #244, exact HEAD628bb6b1ac08c1fffe9078ff6627774995c95fdb, clean retained checkout /Users/alex/Projects/AISTROYKA-pilot-governed-ai-2026-08-24. Remote/local HEAD match.58 changed paths; broad merge is inappropriate. Current main lacks visual-evidence/owner-evidence services, while live visual_evidence_records schema and review/consistency triggers exist. Live record count0; no business record was read or changed. This is another missing integration, not a reason to recreate the module/schema.

Remote history already contains20260824122312 (staging compat),20260824122423 (search path),20260824123120 (report/project consistency) and20260824150000 (security hardening). These are historic applied sources outside the eight-source continuation receipt set. Missing source in main does not authorize replay; preserve originals and reconcile actual definitions before a new migration.

Reusable source:visual-evidence record types/assembly, owner-visible query, manager-review visibility lifecycle, owner overview/progress projection and media-safety tests. Current report repository already provides getProjectIdForReport and approved/rejected/changes_requested review status. Current portal project flag, RBAC, media/result RLS, raw Storage separation and finance guard supersede older baselines.

Audit verdict:RETAIN_AND_RESLICE. Before source integration:

- Visibility updates must fail closed on DB errors and return a meaningful result; old helper swallows query/update errors into an empty/idempotent result.
- A review transition should use the actual persisted reviewed report and trusted project binding, not caller status alone. Repeated review must not republish after rejection or resurrect retained content.
- Published readers require explicit tenant/project, owner_visible, manager_verified, internal_only=false and active retention/account. Old list helper checks only owner_visible and returns SELECT*.
- Live internal policies rely on tenant_members rows and legacy manager/worker literals; implicit tenants.user_id owner access and current membership/role semantics require fresh tests. Existing worker UPDATE policy and visibility-only trigger do not establish immutable reviewed source identity. Test substitution of a published record's media/report/project/retention fields before enabling publication.
- Customer DTOs must exclude uploader/device/provenance internals and costs/margin. Existing customer finance guard runs before any AI context.
- The retained projection returns expiring signed URLs; they do not implement immediate access revocation. Original delivery should recheck active project/publication authorization per request, avoid raw external/private URLs and forbid shared/public cache. Supabase signed URLs survive Auth-key changes until expiry ([docs](https://supabase.com/docs/guides/storage/serving/downloads)).

Next slice:recover the typed published-only read projection and current-access original-delivery contract on fresh main; then wire reviewed evidence lifecycle with isolated SQL/role/source-identity tests and controlled live fixtures. Reuse current signed-path validation and report-project resolvers, not untrusted arbitrary intake URLs. Refresh the selected PR HEAD and every migrated object definition; do not broad merge #244, replay its SQL or enable its unrelated AI/governance/pilot features. AIS-CLIENT-005A extractor remains after Owner/evidence readiness; live camera/voice and Android dependencies are unchanged.
