# Wave 4 Step 9 — Integration

## Sources integrated

- `project_client_request_events` (via `client-requests.repository`)
- `project_client_requests` (titles, status, action_mode for action-needed)
- `project_stakeholders` (manager-only invite/join synthesis)

## Intentionally not touched

- Step 8 notification / delivery tables and routes.
- Approvals, documents, budget domain logic.
- Generic `GET /timeline` implementation (still used for operations).
