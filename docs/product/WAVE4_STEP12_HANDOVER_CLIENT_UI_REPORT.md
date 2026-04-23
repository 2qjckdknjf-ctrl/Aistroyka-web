# Wave 4 Step 12 — Stakeholder visibility report (Stage E)

## E1. Surfaces

- **`ClientPortalViewClient`:** “Handover & completion” card driven by `client-view` payload `handover`.
- Copy adapts to `in_progress` | `handover_ready` | `handed_over` | `completed`.
- Shows **`handover_notes`** only when the team has recorded handover (`handed_over` / `completed`).
- Timestamps for handover/completion when present.

## E2. Visibility rules

- **No** internal blocker list, codes, or document/request IDs.
- Status is **high-level** and trust-oriented.

## E3. API

- `getClientProjectView` includes `handover` from `getHandoverPublicSummary` (fails soft to `null` if handover read fails).
