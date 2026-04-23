# Wave 4 Step 7 — Stakeholder access inventory (Stage A)

## A1 — Prior model (Step 6 and earlier)

- Client portal and client requests **read/respond** were gated on **`project_members.role === owner`** (customer representative) or new policy hooks.
- **No** first-class external identity: stakeholders without that membership could not use the portal.

## A2 — Where “stakeholder == project owner” applied

- `canReadClientPortalView` previously equated to **project owner** only.
- `respond` required the same membership.

## A3 — Minimal model chosen (implemented)

**Table `project_stakeholders`** (per project, per email):

| Field | Purpose |
|-------|---------|
| `stakeholder_role` | `client_viewer` \| `client_decision_maker` |
| `status` | `invited` \| `active` \| `revoked` |
| `token` + `expires_at` | Invite acceptance |
| `user_id` | Set when invite is accepted |

**Accept flow** adds **`tenant_members` as `viewer`** when the user is not already the tenant owner, so existing **tenant context** (`requireTenant`) continues to work.

## A4 — Deferred

- SSO / SAML / OIDC
- Org-wide external directory
- Fine-grained permission matrix beyond viewer vs decision-maker
- Email delivery automation (invite link is returned for manual share in UI)
- Dashboard UI hiding non-portal tabs for viewer-only users
