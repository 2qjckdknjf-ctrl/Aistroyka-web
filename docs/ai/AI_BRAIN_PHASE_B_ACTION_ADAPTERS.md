# AI Brain Phase B — Action Adapters

**Status:** Phase B  
**Date:** 2026-03-23

## Draft Adapters

| Action Type | Adapter | Availability | Behavior |
|-------------|---------|--------------|----------|
| draft_followup_task | DraftFollowupTaskAdapter | When tasks module available | Returns proposal payload; no persist |
| draft_report_review_note | DraftReportReviewNoteAdapter | When reports available | Returns proposal |
| draft_request_more_evidence | DraftRequestMoreEvidenceAdapter | When evidence module available | Returns proposal |
| draft_manager_escalation | DraftManagerEscalationAdapter | Always (manager mode) | Returns proposal |
| draft_client_update | DraftClientUpdateAdapter | Always | Returns sanitized proposal |
| draft_document_followup | DraftDocumentFollowupAdapter | When documentPressure.available | Returns proposal |
| draft_approval_followup | DraftApprovalFollowupAdapter | When approvalPressure.available | Returns proposal |

## Rules

- Declare availability
- Validate scope (tenant, project)
- Validate policy result before adapter runs
- Return structured success/failure/degradation
