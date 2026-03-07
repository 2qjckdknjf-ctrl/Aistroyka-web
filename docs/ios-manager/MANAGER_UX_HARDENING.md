# Manager UX Hardening (Phase 4)

**Date:** 2026-03-07  
**Scope:** Refinements around new operational actions.

---

## Applied in Phase 4

- **Report detail:** Review action bar with Approve / Mark reviewed / Request changes; optional note; loading and error states; status label (e.g. "Changes requested"); reviewed_at and manager_note shown when set.
- **Notifications:** Inbox-first list; read/unread indicator; tap marks read; devices in disclosure for diagnostics.
- **Dashboard:** Tappable overdue/due today/reports pending with navigation to task or report detail.

## Patterns

- **Status badges:** Report and task status shown as capitalized label (e.g. "Approved", "Changes requested"). No separate badge component yet; can be extracted in Phase 5.
- **Success/error:** Inline error under review actions; no global toast (avoid adding dependency); refresh after mutation shows updated state.
- **Action placement:** Review actions in report detail; assign in task detail; consistent placement of primary actions in the relevant detail view.

## Optional future

- Reusable status badge component; alert banner for offline/errors; toast or inline confirmation for assign success.
