# STATUS — AISTROYKA

> Live project status. Keep this short and mobile-readable.

**Last updated:** 2026-09-15  
**Updated by:** docs — AI development alignment; current contractor-ops scope unchanged

---

## Now

| Field | Value |
|---|---|
| **Active slice** | Contractor-ops pilot baseline — TASK-AISTROYKA-002 **READY** (soft gate) |
| **Live artifact** | sha7 `09f7bcd` on staging + prod (MATCH) |
| **Branch tip** | `main` (git tip may be ahead of Worker build; trust live `buildStamp.sha7`) |
| **Pilot scope** | **contractor-ops-only** — NOT FULL / NOT portal |
| **Gate** | AC-002-1 PASS · AC-002-2 **N/A** · AC-002-3 CLOSED · AC-002-4 PASS @ live |
| **Runtime** | Auth: email, Apple, Google, QR, Telegram where enabled. Phone OTP hidden/disabled. Twilio is not a launch gate. |
| **Next** | Hold portal/stakeholder until new scope decision; HiAir Play/ASC separate; keep entitlement account-first OFF |
| **Closed** | PR #277; PR #342 STATUS refresh; PR #343 paths-ignore; contractor-ops READY 2026-09-14 |

## Not approved / forbidden claims

- **Not approved:** stakeholder / client **portal READY**
- **Not approved:** **FULL** (contractor + portal) pilot READY
- **Not approved:** finance-boundary proof for portal users (AC-002-2 N/A — not closed, out of scope)
- **Not approved:** new production feature deploys beyond current live artifact (this STATUS is docs only)
- Re-widen to FULL only with explicit Sasha/Commander decision + stakeholder smoke

## Notes

- Deploy SoT: Cloudflare Workers (Vercel = preview only). Docs merges: prefer `[skip-staging-deploy]` in commit message; STATUS.md is also under staging `paths-ignore` (#343).
- Strategic AI/intelligence work is ordered in `docs/roadmap/AISTROYKA_AI_INTELLIGENCE_SEQUENCE.md`. It is **not the active production slice** and does not override contractor-ops pilot gates. Agents must follow `AIS-PILOT-001 -> AIS-EVID-002 -> ...` dependencies rather than jumping to client video/matching/materials features.

---
