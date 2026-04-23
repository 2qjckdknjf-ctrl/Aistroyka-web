# Wave 4 Step 10 — Discussion scope inventory (Stage A)

## A1. Strongest initial discussion targets

The product already exposes client visibility, client requests/actions, external stakeholder identity, notifications, and activity timeline. The smallest justified **structured resolution** surface targets threads that naturally end in a **decision or documented outcome**, not open conversation.

| Target | Fit | Notes |
|--------|-----|--------|
| Document clarification | High | Aligns with approvals/documents; linkable entity. |
| Milestone decision / option selection | High | Schedule already exists; `option_selected` entry kind supports explicit choices. |
| Client request follow-up | High | Reuses stakeholder response semantics; `request_followup` kind. |
| General project issue needing resolution | Medium | `general` kind as escape hatch; still finite threads, not chat. |

## A2. Discussion kinds chosen (minimal set)

Implemented in schema and TypeScript as:

- `document_clarification`
- `milestone_decision`
- `request_followup`
- `general`

## A3. What this phase is NOT

- **Not** free-form chat or messenger UX.
- **Not** arbitrary comments on arbitrary records across the product.
- **Not** helpdesk/ticketing (SLAs, queues, assignment pools).
- **Not** CRM or sales pipeline.
- **Not** a dashboard redesign.

Discussions are **explicit threads** with **kinds**, **lifecycle status**, **structured entries**, and **resolution summary** suitable for audit.

## Deferred scope (intentional)

- Real-time presence, typing indicators, read receipts.
- Multi-party @mentions and notification fan-out per entry (timeline covers high-level visibility; push/email for discussions not wired in this step).
- Full-text search across all discussions across projects.
- Mobile-native discussion UIs (Android/iOS) outside existing web portal patterns.
