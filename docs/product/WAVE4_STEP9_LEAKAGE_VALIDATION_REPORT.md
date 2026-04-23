# Wave 4 Step 9 — Leakage / route confidence (Stage E)

## E1 — Manager audience

- **Route:** `GET /api/v1/projects/:id/stakeholder-activity` returns `audience: "manager"` when `getProjectForInternalWorkspace` succeeds.
- **Tests:** Route test asserts `getStakeholderActivityTimeline` is called with `viewer: "manager"` and **`shapeManagerAudience` is invoked**; **`shapeStakeholderAudience` is not** invoked on that path.
- **Read model:** `shapeManagerAudience` returns full items including `visibility: "internal"` and `actorId` (unit test).

## E2 — Stakeholder audience

- **Route:** Returns `audience: "stakeholder"` when internal workspace fails but `canReadClientPortalView` is true.
- **Tests:** Asserts `shapeStakeholderAudience` is called and **`shapeManagerAudience` is not** on that path.
- **Shaping:** `shapeStakeholderAudience` unit test drops `visibility: "internal"` rows and strips `actorId` / `visibility` from JSON.

## E3 — Unauthorized

- **Route test:** Returns **403** when neither internal nor portal access.

## E4 — Repository-level omission

- **`client_request_updated`:** Omitted for `viewer === "stakeholder"` inside `getStakeholderActivityTimeline` (not only at shape layer).

## Confidence

**Strong** for API branching + shaper behavior (covered by tests). **Strong** for compile-time linkage after `listEventsForProject` exists (production build green).
