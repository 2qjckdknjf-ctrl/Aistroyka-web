# Research deferrals — Codex/Cursor delta 2026-11-24

Vendor candidates reviewed for availability/license/security before any install. **Decision: DEFER** until owner budget + sandbox gates.

| ID | Candidate | Check | Decision |
|---|---|---|---|
| D7 | Strands Box / LangSmith Tool Gateway | Would add new sandbox runtime + possible paid SaaS; not a substitute for `runPolicy` | **DEFER** — no install |
| D9 | OmniEVIE-4B / GLM CAD models | Not in current provider allowlist; license/pricing unverified for construction PII | **DEFER** — no model add |
| D11 | Monitor API (competitor/supplier tariffs) | External market data + signed events; risk of autonomous order coupling | **DEFER** — no connector |
| D12 | Claude Ship observe-only | Overlaps existing governed-ai-pr-e2e + branch protection; auto-merge banned | **DEFER** — keep ROMA/human APPROVED |

No new dependencies, network egress, or provider keys introduced by this note.
