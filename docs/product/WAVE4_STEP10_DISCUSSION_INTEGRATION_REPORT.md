# Wave 4 Step 10 — Integration report (Stage F)

## F1. Integrated surfaces

| Integration | Status |
|-------------|--------|
| Client portal routes under `/dashboard/projects/[id]/client/discussions` | Implemented |
| Project dashboard panel | Implemented |
| Stakeholder activity timeline | **Yes** — `stakeholder-activity-timeline.repository.ts` emits `discussion_opened` and `discussion_resolved` with links to `/client/discussions/{id}` |

## F2. Intentionally not touched or minimal

| Area | Notes |
|------|--------|
| Push/email notifications | **Not** wired for new discussion or replies in this step (would reuse stakeholder notification stack in a follow-up). |
| Client requests UI | No automatic thread per request; optional `linked_entity_type=client_request` only. |
| Document / milestone screens | No inline “start discussion” buttons; linkage via UUID fields on create. |
| Android / iOS native | Out of scope for Step 10. |

## F3. Coherence

- Discussion URLs are consistent between timeline and portal (`/client/discussions/...` relative to project client area).
- Policies align with existing portal read/respond gates.
