# Wave 4 Step 9 — Stakeholder / client UI

## Surfaces

1. **Client portal** (`ClientPortalViewClient.tsx`)
   - **Activity** section via `ClientPortalActivitySection` → same API with stakeholder audience shaping.

2. **Component** — `ClientPortalActivitySection` fetches `/stakeholder-activity` and renders `StakeholderActivityBlock`.

## Action-needed highlighting

- `actionNeeded` is set when a **created** request is still `open` with `action_mode === "action_required"` (manager view computes from current request meta).

## Limitations

- Stakeholders do not see **invite** or **other users’ join** events — only their own “You joined the client portal” when applicable.
