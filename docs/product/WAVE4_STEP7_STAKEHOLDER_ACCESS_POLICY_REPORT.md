# Wave 4 Step 7 — Access policy (Stage C)

## Roles

| Role | Portal read | List client requests | Respond to requests |
|------|-------------|----------------------|---------------------|
| `project_members.owner` (legacy) | Yes (if portal on) | Yes | Yes |
| `client_viewer` (external) | Yes | Yes | **No** |
| `client_decision_maker` (external) | Yes | Yes | **Yes** |
| Managers / internal | Use manager APIs | N/A | N/A |

## Enforcement points

- **Read portal**: `canReadClientPortalView` — portal enabled + (owner **or** active stakeholder).
- **Respond**: `canRespondToClientRequests` — portal enabled + (owner **or** `client_decision_maker`).
- **UI**: `ClientPortalRequestsSection` hides respond controls when `capabilities.can_respond_to_requests` is false.

## Leakage

- Stakeholder DTOs unchanged from Step 5/6 (still curated projections).
- External users get **tenant viewer** membership: **not** a reduced RLS scope in this step — app-level portal routes remain the primary gate for customer-safe payloads.

## Limitations

- **P1**: `tenant_members.viewer` may see other workspace surfaces if they navigate away from the portal; not a full “portal-only” shell.
