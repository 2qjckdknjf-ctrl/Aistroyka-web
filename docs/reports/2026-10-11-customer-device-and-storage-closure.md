# Customer device and Storage closure —2026-10-11

Source baseline 0bc5d602 (#425). This report records focused functional/security evidence, not whole-project completion. The Customer changes are in the current QA branch until protected merge. Tested iOS source hashes are in [source manifest](customer-device-2026-10-11/source-sha256.json).

## Protected delivery and lost work recovered

#423 HEAD eafed898 → main a6fd98d8: served-commit checks, actual checked-out staging SHA and production-mode cron secret enforcement. Staging 38142898000/production 38143173440 SUCCESS, actual health a6fd98d on canonical hosts.

#424 HEAD 04687606 → main 7680e85b: repository now selects client_portal_enabled. The repair existed in retained release commit fc78f95f and was absent from main; only the required flag was recovered. The real selected-column regression had 3 positive failures before the repair. 26 affected tests and 10 finance proof guard tests PASS. Required CI 38143846175, staging 38144080849, production 38144292134 SUCCESS. Production stakeholder smoke now requires HTTP 200/expected project; error 403 can no longer masquerade as finance proof. Physical cellular /health also verified 7680e85 on all 3 hosts.

#425 HEAD 9b03d377 → main 0bc5d602: Storage still used all tenant_members roles after media-row RLS hardening. One exact synthetic private object in an ungranted project was signable by a stakeholder (HTTP 200). Retained #196 contains an earlier filter, but still permits viewer and stakeholder project-prefix INSERT; it is not safe to broad merge. Current repair uses existing internal reader/writer helpers and active-account checks, preserving both tenant and project path layouts. 48 SQL checks in PGlite and 48 in native isolated PostgreSQL PASS; actual Storage transport has 8 positive/negative checks PASS. Staging 38145192971 and production 38145444741 SUCCESS; actual health 0bc5d60. Applied remote 20261011140341. Eight source files/seven remote IDs verified; the new source candidate now returns ALREADY_APPLIED_DO_NOT_REPLAY. No schema/history replay or object rewrite.

## Physical functional proof

Customer Debug on iPhone 17 Pro, iOS 27; final result customer-live-revocation-160757.xcresult: 1/1 PASS, 30.452 seconds. Real AuthService sign-in → actual portal list → project detail → project-bound manual intake save → list reload → external exact-fixture grant revocation → API 404 → explicit refresh clears cached projection/feedback/actions → sign-out returns login. Backend verification confirms draft user/tenant/project/status, not just a UI success label. Own-project/media access and same-tenant ungranted project/media plus internal-cost isolation had 6 prior live checks; revoked project and both media rows subsequently disappear through RLS.

Fixes: bootstrap only once per root identity; localized invalid-credential copy and Auth error-code parsing; private opt-in DEBUG input prefill/diagnostics; keyboard Done and interactive dismissal for intake; accessible project refresh; clear data on 401/403/404 while keeping it on transient errors; latest refresh generation wins. Customer strings updated in en/ru/es/it. iOS 16 compatibility retained; scroll bounce is conditional from 16.4. Shared Auth/portal contracts 17/17 PASS. Unsigned Release build PASS; DEBUG fixture comparison strings are absent from its executable. This is a build check, not a signed distribution artifact.

The physical test used runner-supplied DEBUG prefill because XCTest secure typing did not preserve the fixture password. It still invokes actual sign-in and backend calls; no token/role/response is fabricated. Manual password entry, provider OAuth UX, push/offline, Manager/Worker full flows, TestFlight/store signing and pilot binaries are separate evidence.

Network diagnosis: NWPath first showed wifi=true/cellular=false; after Wi-Fi was disabled in Settings, cellular=true and health passed. CoreDevice reported wired/connected; SPUSBDataType did not reliably enumerate the device. No global Mac network setting was changed.

## Cleanup and remaining boundaries

Removed 3 task-created drafts, 2 projects, 2 media metadata rows, 1 cost, 1 grant, 1 membership, temporary Auth user and all task-created Storage objects. Verified exact row/user/blob absence. All temporary-user sessions revoked; the separately created owner task session was refreshed and locally revoked, without global owner logout. Runner credentials scrubbed. No invite email, extra tenant, real business row or real blob was read/edited in these probes. Evidence/credentials stayed in the private archive; no private credential in source.

Security advisors still show the prior INFO service-only RLS-without-policy group and WARN executable SECURITY DEFINER helper groups. This is not an all-advisors-zero claim. Old mixed #195/#196/#206 PRs remain for semantic review; #200 is closed as superseded with source retained.

Storage signing/access control is distinct from an already-issued capability. Signed URLs remain valid until expiry ([Supabase serving-assets docs](https://supabase.com/docs/guides/storage/serving/downloads)); the proof URL used 60 seconds. Raw contractor Storage is now denied to customers, but a complete published-media gateway, per-request revocation, share/export/AI-summary and Owner UX contracts still need delivery. Do not expand the contractor-ops-only pilot automatically. The next queue is described in [plan/fact](../roadmap/CURRENT_EXECUTION_STATE_2026-10-11.md) and [intake hard audit](../audit/2026-10-11-intake-extraction-hard-audit.md).

## Subsequent delivery

#426 protected merge:HEAD677eea576217b472c7ba45d134b04341c11fa3f9 → main40c7e73b4a666e110eee0f7950bd8edd1242a871. Required CI38146714950 and Worker+Manager+Customer simulator smoke38146714922 SUCCESS. Staging38147780974/production38148048805 SUCCESS; actual canonical health40c7e73. The Customer source is now merged; the earlier QA-pending text records its pre-merge proof stage. Tested source hashes still match main.
