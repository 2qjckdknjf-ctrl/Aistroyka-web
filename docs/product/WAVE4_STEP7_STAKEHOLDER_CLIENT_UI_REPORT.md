# Wave 4 Step 7 — Stakeholder-facing UI (Stage E)

## Acceptance page

- Route: `/[locale]/dashboard/stakeholder-invite` (`StakeholderInviteClient`).
- User signs in with the **invited email**, opens link with `token`, clicks **Accept invitation**.
- On success, redirects to `/dashboard/projects/:id/client`.

## Portal link on project overview

- **Client portal →** visible when portal is enabled **and** (`membership_role === owner` **or** `stakeholder_role` is set from API).

## Request respond UI

- Controlled by `capabilities.can_respond_to_requests` from `ClientProjectView` (false for `client_viewer`).
