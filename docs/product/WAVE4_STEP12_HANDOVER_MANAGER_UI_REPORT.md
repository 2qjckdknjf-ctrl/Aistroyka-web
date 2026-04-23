# Wave 4 Step 12 — Manager UI report (Stage D)

## D1. Surface

**`HandoverManagerPanel.tsx`** (on project detail alongside other client/governance panels when `can_manage_client_portal`):

- Current **status** badge.
- **Blockers** list with counts, human text, and **links** to the relevant dashboard tab or area (schedule, documents, issues, approvals, client portal, discussions).
- **Green** “no blocking items” when `ready`.
- **Primary action** for the next transition (`Mark ready for handover` → `Record handover to client` → `Mark project completed`) with disabled state when gated.
- Optional **textarea** for a note when moving to `handed_over` / `completed` (shared with client when handed over).

## D2. Limitations

- No separate milestone handover screen.
- No custom per-tenant checklist editor.
