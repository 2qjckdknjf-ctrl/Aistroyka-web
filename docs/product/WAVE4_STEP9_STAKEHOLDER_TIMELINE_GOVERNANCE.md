# Wave 4 Step 9 — Governance & leakage controls

## Event rules

- **No synthetic spam:** Rows derive only from persisted events or stakeholder rows.
- **Stakeholder privacy:** Other stakeholders’ emails and invite timing are **not** shown to portal users — only manager view includes invite/join lines for all stakeholders.
- **`client_request_updated`:** Omitted for stakeholder viewers (manager-only operational signal).

## Omitted / internal

- Internal team timeline events (reports, AI, uploads) — **excluded** from this read model; they appear under `GET /timeline` / “Project operations”.
- Raw user ids are **not** exposed to stakeholders (`actorId` stripped).

## Leakage controls

- Server-side `visibility` + `shapeStakeholderAudience` before JSON.
- Route gate: `getProjectForInternalWorkspace` vs `canReadClientPortalView` prevents cross-tenant access.
