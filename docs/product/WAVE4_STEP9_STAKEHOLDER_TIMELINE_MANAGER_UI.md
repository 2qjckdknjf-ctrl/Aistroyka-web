# Wave 4 Step 9 — Manager UI

## Surfaces

1. **Project detail → Activity tab** (`DashboardProjectDetailClient.tsx`)
   - **Client & portal timeline** — `StakeholderActivityBlock` fed by `GET /stakeholder-activity` (manager audience).
   - **Project operations** — existing `ProjectTimelineBlock` / `GET /timeline`.

2. **Owner view** (`OwnerViewClient.tsx`) — already combined client/portal + operations blocks (unchanged pattern).

3. **Component** — `StakeholderActivityBlock` (`components/projects/StakeholderActivityBlock.tsx`): relative time, optional **Action needed** styling for `actionNeeded`.

## Workflow

- Managers open **Activity** to see stakeholder-transparent events first, then internal operations feed.

## Limitations

- No export/CSV in this step.
- Actor UUIDs are in manager JSON but not rendered in the block (audit-ready for future columns).
