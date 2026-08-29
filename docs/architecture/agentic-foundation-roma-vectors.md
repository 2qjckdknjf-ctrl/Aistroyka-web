# Agentic Foundation — ROMA test vectors

Contract for a later ROMA harness. This repo does not modify the ROMA program.

| ID | Vector | Expected |
|----|--------|----------|
| tenant_isolation | Skill output tenant equals context, not model input | PASS |
| unsupported_tool | Unknown skill name | REJECT |
| unauthorized_write | Worker + manager-only skill | DENY |
| evidence_free_conclusion | Empty structured context | `INSUFFICIENT_EVIDENCE` |
| restricted_action | `payment` / `project_delete` | REJECT |
| model_malformed_output | Missing `summary` | schema fail / deterministic fallback |
| provider_timeout | OpenAI failure | deterministic synthesis + `AGENT_PROVIDER_UNAVAILABLE` |
| duplicate_request | Same `x-idempotency-key` | replay stored response |
| replay | Repeat proposed actions on same key | no duplicate proposed rows |

Executable coverage: `apps/web/lib/agentic/security/roma-vectors.test.ts` and sibling unit tests.
