# Staging list GET + Graph + iOS UITest — 2026-11-26

Runtime: staging+prod `buildStamp.sha7=101c824` (MATERIAL list GET deployed). Main tip may be ahead (`6e82b51` docs).

## MATERIAL-008 list GET (live)

| Call | Result |
|---|---|
| `GET …/projects/bbcb592b-…/materials/requirement-drafts` | **200** — 1 draft (`ec05f306-…`, need `9.702000`, packs `7`) |
| Client synthetic → same path | **403** Insufficient rights |

## AIS-GRAPH-004 / Manager APIs (live)

Smoke project `bbcb592b-…` (SMOKE_*):

| Call | Result |
|---|---|
| `GET …/graph` | **200** — `nodes:3`, `edges:2` |
| `GET …/completeness/templates` | **200** — 1 template |
| `GET …/reconciliation/findings` | **200** — `findings:[]` |

Synthetic demo project `b4e8c210-…` returns **404** for these contractor routes under SMOKE_* (expected cross-tenant/not-found).

## Device contour (simulator)

`CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh` → **PASS**

- Worker login pilot identifiers
- Manager login pilot identifiers  
- Customer login pilot identifiers

Physical USB device smoke still **NOT_RUN**.

## Dependabot (post-enable inventory)

Open alerts (API): 1 critical / 46 high / 30 medium / 14 low. Critical: `proxy-addr` GHSA-jqcg-44mw-7w3h in root `package-lock.json` (Vercel npm lock). High includes `zod` (contracts) and multiple `undici` lock entries. **No blind major bumps** this pass — triage/PR separately.

## Explicit non-claims

- Graph live read ≠ full video→review→Graph lineage.
- Simulator UITest ≠ physical device / store Mode B.
- Dependabot inventory ≠ remediations merged.
