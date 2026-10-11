# AIS-CLIENT-005A hard audit —2026-10-11

Observed source 0bc5d602. Verdict: PARTIAL_IMPLEMENTED / REUSE_EXISTING; Owner/evidence gates are not fully closed for a new extractor. This is a source/dependency audit, not live LLM extraction certification. Existing modules were tested together:14 Vitest files, 126 tests PASS. Local retained module history and intake/extraction paths were inspected; no owner-bound extractor was found in the inspected current implementation. This does not certify every retained dirty snapshot or 74 mixed backlog PRs as empty.

| Requirement | Existing implementation to reuse | Remaining dependency |
|---|---|---|
| Manual draft | customer-intake service/types and portal/intake routes; live RLS/lifecycle | Existing tenant/project authorization; no duplicate CRUD target |
| Human lifecycle | draft→submitted/withdrawn with idempotent reread/CAS | AI draft scope/items, observations/rooms/zones and version/provenance are absent from this draft contract |
| Async jobs | create-vision-job service, request_key RPC and lifecycle | Media requires project; no preproject owner workspace/source binding |
| Worker execution | runOneJob session CAS/token scope; platform ai_analyze_media handler | Legacy worker explicitly fails video as not implemented; platform media handler requires report_id and does not persist a source-linked reviewed result |
| Graph | construction-graph repository/model, current overlay persistence | Project queries depend on project-scoped sources; no demonstrated intake-ID promotion without duplicates |
| Customer identity | CustomerAuthGate permits invited stakeholder; portal tenant resolver requires tenant/access | Owner-bound preproject client-account lifecycle and mobile role contract must be explicit; do not auto-create a project to satisfy existing FK |
| Media refs | Draft stores validated data-only media_id/HTTPS references | Not authorization to fetch arbitrary URLs; extractor must use trusted scoped objects and SSRF/provider/retention boundaries |
| Publication/revocation | #424 project access fixed; #425 direct raw Storage denied to stakeholders | Published-only original delivery, current-access gateway, share/export/summary contract and full invitation workflow |

The source inventory explains why manual submit/withdraw is not completed AI scope extraction. Current customer commercial artifacts are intentionally distinct from contractor costs/margin. Projection must precede LLM context construction. Existing service keys remain server-only.

Next order:complete Owner publication/access and evidence/Vision source-linked result proof; then specify the additive owner-bound preproject workspace/ownership/review/promote contract, reuse the existing job and graph foundations, and implement one reviewed text/photo slice with hermetic tests and live provider evidence. Video follows a verified executor. Provider failure must leave a recoverable draft; AI observations carry uncertainty/source coordinates and require human confirmation. No automatic estimates/contracts/assignments. AIS-CLIENT-005B and AndroidD2 keep their current dependencies. Applied SQL receipts and saved sources are reused; broad old-branch merges remain inappropriate.
