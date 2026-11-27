# Staging completeness evaluate smoke — 2026-11-25

Follow-up to Manager UI inventory (#534) + templates GET smoke.

## Environment

| Field | Value |
|---|---|
| Base | `https://staging.aistroyka.ai` |
| Runtime SHA | `91ff124` (health) |
| Project | `0ed33099-55a9-4568-861a-ebd224bb29e0` |
| Auth | SMOKE_* JWT |

## Calls

| Call | Result |
|---|---|
| `GET …/completeness/templates` | 200 approved waterproofing template |
| `POST …/completeness/evaluate` body `{"templateId":"trade.waterproofing.wet_area","inventory":[]}` | **200** |
| Evaluation verdict | **`INSUFFICIENT_EVIDENCE`** |
| Persist | `evaluation_id=2f6e073c-8b8b-446a-877d-75f758a346ce` |

Missing required evidence correctly surfaces questions (e.g. contract scope) — never PASS.

## Verdict

RULE-015 evaluate path on staging: **PASS** for empty-inventory / insufficient-evidence behavior.
