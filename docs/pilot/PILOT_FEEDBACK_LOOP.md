# Pilot Feedback Loop

**Phase 6 — Pilot Deployment & Observability**

---

## How feedback is captured

- **Channel:** Defined per pilot (e.g. email, Slack, form, support tool). Document in PILOT_TENANT_READINESS.md for the pilot tenant.
- **From users:** Free-text description; optional screenshot; request_id or “last error” from diagnostics when available.
- **From support/PM:** Triage and tag feedback with tenant, user (if safe), app (web / iOS Worker / iOS Manager), version and build.

---

## How bugs are classified

- **Bug:** Incorrect or broken behavior (e.g. “Submit fails”, “Sync stuck”, “Wrong data shown”). Assign severity (P0–P3) per INCIDENT_RESPONSE_PLAYBOOK.md; track in backlog or issue tracker with labels: pilot, surface (web/ios_worker/ios_manager), failure domain (auth, sync, upload, etc.).
- **Repro:** Request_id, version, build, and steps allow backend/mobile logs to be correlated and root cause found.

---

## How UX feedback differs from incidents

- **UX feedback:** “Hard to find”, “Confusing”, “Would prefer X”. Not an incident; no rollback. Capture in backlog as “pilot UX”; prioritize with product. Optionally tag by tenant and screen.
- **Incident:** Something is broken or severely degraded; follow incident playbook and severity.

---

## How feature requests are prioritized

- **Pilot feature requests:** Log with tenant/source; do not commit to timeline during pilot. Review in pilot retro; some may become backlog items for Phase 7+.
- **Prioritization:** After pilot, product and eng align on: must-have for GA vs nice-to-have; dependency and effort.

---

## Mapping feedback to tenant / user / build / version

- **Tenant ID:** From diagnostics or from support (who reported).
- **User ID:** Only if needed for repro and safe to store (e.g. internal tool); do not expose in public backlog.
- **Build / version:** From diagnostics (app version, build number); from error report or support form.
- **Request_id:** When user or support provides it, use to search backend logs and trace the request.
- **Stored fields (minimal):** tenant_id, app_surface (web | ios_worker | ios_manager), version, build, request_id (optional), summary, severity, date. Kept in issue tracker or pilot feedback store.

---

## Implementation status

- **Done:** Design and documentation above.
- **Pending:** Concrete pilot channel (email/form/tool) and owner; optional lightweight feedback form or template for pilot testers.
