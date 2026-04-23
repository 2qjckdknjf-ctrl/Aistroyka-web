# Wave 4 Step 7 — Integration (Stage F)

## Authoritative access

- Portal read and request respond policies are **no longer owner-only**; they resolve **active `project_stakeholders`** rows.
- **Backward compatibility**: existing `project_members.owner` paths remain valid.

## Project discovery

- Stakeholders see invited projects in **project list** via merged query.

## Not in scope

- Notifications when invited
- Automatic email with link
- Restricting tenant-wide navigation for viewer stakeholders
