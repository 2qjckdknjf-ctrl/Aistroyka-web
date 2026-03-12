# Document & E-Sign Ecosystem

**Phase 11 — Ecosystem Integrations & Platformization**  
**Contract lifecycle, storage, approval, e-sign; no core domain rewrite.**

---

## Contract lifecycle

- **Phases:** Draft → Review → Approval → Sign → Stored. We do not implement full CLM in core; we define hooks and storage so documents can be attached to projects/tasks and optional approval/sign flow can call out to e-sign provider.
- **AISTROYKA today:** No native “contract” or “document” entity. Reports and media are the closest (report = submission; media = photos/files). Audit log records actions.
- **Extension:** Optional “document” or “contract” entity: project_id, type (contract, change_order, handover), status (draft, in_review, approved, signed), storage_ref (path or external_id). Lifecycle transitions via API or app; e-sign step delegates to provider (DocuSign, etc.).
- **Value:** One place to see “documents for this project”; traceability and audit trail; e-sign for compliance.

---

## Document storage

- **Current:** Media and report assets in Supabase Storage; path and metadata in DB. No generic “document” bucket or metadata schema.
- **Abstraction:** Optional “document” storage namespace (e.g. tenant_id/project_id/documents/) with metadata: name, type, size, created_at, version. Same storage backend initially; later pluggable (S3, SharePoint) via adapter. See MEDIA_STORAGE_INTEGRATIONS for storage abstraction.
- **Access:** Scoped by tenant and project; RBAC (e.g. only owner/admin or designated role can upload/delete). Links for view/sign generated with short-lived signed URL.

---

## Approval flows

- **Concept:** Document moves through states: draft → pending_review → approved | rejected. Approvers are tenant users (e.g. manager list or role-based). We store state and who approved when; no heavy workflow engine in core.
- **Data:** document_id, status, approved_by[], approved_at, rejection_reason. Optional “approval_rule” per document type (e.g. requires 2 approvers). Implement as simple state machine in integration layer.
- **Notifications:** Notify approvers when document enters pending_review; use existing notification and push. No new domain entity; optional table or JSON on “document” extension.

---

## Digital signature pathways

- **Options:** (1) Integrate e-sign provider (DocuSign, HelloSign, etc.): we send document + signer list; provider returns signed PDF and event. (2) Internal “acknowledged” only: user clicks “I agree” in app; we record user_id and timestamp (not legal e-sign). (3) External: customer signs in their system; we store “signed” ref and date.
- **Pathway for (1):** Adapter: upload document to provider, create envelope, redirect signers; webhook for “completed” → we update document status and store signed file ref. No e-sign logic in core; adapter and config per tenant (provider, credentials).
- **Legal audit trail:** All actions (upload, status change, approval, sign event) in audit_logs with tenant_id, user_id, resource_type=document, resource_id, details. Retain per DATA-RETENTION and compliance.

---

## Legal audit trail

- **Already:** audit_logs for app actions (report submit, review, invite, etc.). Extend to document actions: document_uploaded, document_approval_requested, document_approved, document_rejected, document_sent_for_signature, document_signed.
- **Fields:** tenant_id, user_id, action, resource_type, resource_id, details (version, signer, provider_event_id). No PII in details; only IDs and event type.
- **Retention:** Same as audit_logs; export for legal on request. See COMPLIANCE_AND_AUDIT.

---

## Implementation principles

- **Modular:** Document and e-sign are extension; optional “document” entity and adapters. Core domain unchanged.
- **Tenant-safe:** Documents and approvals scoped by tenant and project; RLS and authz on any new table.
- **Standard protocols:** Use provider REST APIs (DocuSign, etc.); no custom crypto. Store only refs and status.
- **Value first:** Start with “attach document to project” and one e-sign provider; add approval workflow and more providers when needed.
