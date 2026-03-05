# ADR-062: Security events stream

**Status:** Accepted  
**Decision:** Suspicious actions (login failures, export from new IP) documented to be written to audit_logs with type security or dedicated security_events. Consumed by anomaly detectors and playbooks. Implementation can use existing audit_logs with details.type.
