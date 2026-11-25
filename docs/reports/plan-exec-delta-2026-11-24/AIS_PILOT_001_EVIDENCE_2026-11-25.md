# AIS-PILOT-001 evidence — 2026-11-25

P0 queue item: exact-SHA role/revoke/source negatives + live receipts (mega-roadmap «Следующая очередь»).

## Candidate SHA / environment

| Field | Value |
|---|---|
| `origin/main` tip | `80ff987` (merge #534 docs inventory; runtime tip still `#531` Actions pins) |
| Staging health | `GET https://staging.aistroyka.ai/api/v1/health` → `buildStamp.sha7=91ff124` (`env=staging`) |
| Production health | `GET https://aistroyka.ai/api/v1/health` → `buildStamp.sha7=91ff124` (`env=production`) |
| Runtime note | Docs-only #534 does not change Worker bundle; live code equals Actions-pin deploy `#531` |

## Historical security merges (do not re-implement)

| PR | Merge SHA | Role |
|---|---|---|
| [#446](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/446) | `3b67ad6` | Attachment/project/source enforcement |
| [#447](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/447) | `cc58e42` | Private helper grants |

Mega-roadmap table row that still said «#446/#447 OPEN DRAFT» is **SUPERSEDED** (both merged 2026-10-28).

## Unit / route negatives (local vitest)

Command (from `apps/web`, 2026-11-25):

```bash
bunx vitest run \
  'app/api/v1/reports/[id]/route.test.ts' \
  'app/api/v1/tenant/revoke/route.test.ts' \
  lib/security/customer-finance-guard.test.ts \
  lib/api/lite-allow-list.test.ts \
  lib/platform/ai/media-path-tenant-guard.test.ts \
  lib/tenant/membership-privilege-escalation.rls.test.ts \
  lib/tenant/tenant-writer-rls.hardening.test.ts \
  lib/domain/customer-intake/customer-intake-rls.hardening.test.ts \
  lib/domain/customer-intake/portal-intake-tenant.test.ts \
  lib/domain/portal/published-evidence.service.test.ts \
  lib/platform/ai-governance/transitive-authorization.test.ts \
  lib/platform/ai-governance/policy.service.test.ts
```

**Result:** 12 files, **159 tests PASS**.

Coverage map (requirement → suite):

| Gate | Suite | Notes |
|---|---|---|
| Foreign / peer report GET | `reports/[id]/route.test.ts` | D5 peer isolation |
| Membership revoke | `tenant/revoke/route.test.ts` | Revoke path unit coverage |
| Privilege escalation RLS | `membership-privilege-escalation.rls.test.ts` | Writer/escalation negatives |
| Tenant writer RLS | `tenant-writer-rls.hardening.test.ts` | Cross-tenant write deny |
| Intake / portal tenant | `customer-intake-rls.*`, `portal-intake-tenant.*` | Portal/intake isolation |
| Published evidence ACL | `published-evidence.service.test.ts` | Viewer/publish bounds |
| Media path tenant | `media-path-tenant-guard.test.ts` | Path substitution guard |
| Lite client allow-list | `lite-allow-list.test.ts` | `ios_lite`/`android_lite` 403 |
| Customer finance isolation | `customer-finance-guard.test.ts` | Internal finance not on customer surfaces |
| AI transitive handoff | `transitive-authorization.test.ts` + `policy.service.test.ts` | Handoff / policy fail-closed |

## Staging live smoke (authenticated)

Smoke user from local `.env.local` (`SMOKE_*`); project `0ed33099-55a9-4568-861a-ebd224bb29e0`.

| Call | HTTP | Observation |
|---|---|---|
| `GET /api/v1/projects/{id}/completeness/templates` | **200** | Approved waterproofing template payload |
| `GET /api/v1/projects/{id}/reconciliation/findings` | **200** | `{"data":{"findings":[]}}` |
| `GET /api/v1/reports/00000000-0000-4000-8000-000000000099` | **404** | Unknown report → Not found (no leak) |

## Verdict

| Dimension | Status |
|---|---|
| Code / unit negatives on current tree | **PASS** (159) |
| Staging Manager completeness/recon API | **PASS** (templates + findings) |
| Staging unknown-report peer probe | **PASS** (404) |
| Full foreign-tenant + revoked-role + source-substitution + direct-RPC live matrix | **PARTIAL** — requires second persona / revoked membership fixture + independent reviewer; not invented here |
| Device / TestFlight role smoke | **NOT_RUN** this slice (Mode B iOS VALID separately; no new device attach) |

**Overall AIS-PILOT-001:** remains **PARTIAL** for full M1 closure (live multi-persona revoke/RPC matrix + independent verdict), but no longer «PR_ONLY / missing code». Unit + staging API receipts attached to SHA `91ff124` runtime / tip `80ff987`.

## Explicit non-claims

- Not production GA.
- Not full role-revoke live E2E across two tenants.
- Not Dependabot alerts enablement / vendor ZDR / tenant key vault fill (still OWNER_GATE).
