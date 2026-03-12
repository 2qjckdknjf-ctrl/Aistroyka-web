# Org Admin Tooling — Enterprise

**Phase 7 — Enterprise Hardening**

---

## 1. Org admin panel requirements

- **Current:**  
  - **Tenant-scoped admin** (owner/admin only): Dashboard layout gates `/admin` with `requireAdmin(supabase)` (owner or admin in at least one tenant). Admin pages: AI (overview, security, requests), jobs, SLO, push, system, governance, trust. All data is tenant-scoped; admin sees only tenants where they are owner/admin.  
  - **Org-level:** API routes under `/api/v1/org/*` (e.g. org/tenants, org/metrics/overview) require `x-organization-id` and org_owner/org_admin. These are for future multi-tenant-org (org) management; no full org admin UI in repo yet.  
- **Requirements for enterprise org admin:**  
  - **Identity:** Clear separation between “tenant admin” (current /admin) and “org admin” (manages multiple tenants under one org).  
  - **Org admin panel:** List tenants in org; view org-level metrics; manage org-level settings (e.g. default retention, feature flags).  
  - **Access control:** Only org_owner / org_admin can access org admin; enforce in layout and API (x-organization-id + role check).  
  - **Audit:** All org admin actions (e.g. tenant suspend, role change at org level) must be audited (audit_logs or dedicated org_audit table).

---

## 2. Role management UX

- **Current:**  
  - Tenant roles (owner, admin, member, viewer) are stored in tenant_members. Invite flow and accept-invite set initial role; tenant settings (owner/admin) can allow changing roles.  
  - No dedicated “Role management” page in repo; member list is at tenant/members (API: GET /api/tenant/members) and likely in team/settings UI.  
- **Recommendations:**  
  - **Tenant role management:** Provide a clear UX to list members, show role, and change role (owner/admin only). Enforce min one owner per tenant.  
  - **Org role management:** When org model is active, provide UX for org_owner and org_admin assignment; document who can grant org_admin.  
  - **Visibility:** Members see only their own role unless they are owner/admin (who see full list). Document in RBAC matrix (SECURITY_HARDENING).

---

## 3. Tenant governance settings

- **Current:**  
  - Tenant-level settings may include: subscription tier, feature flags, privacy_settings (pii_mode, redact_ai_prompts, allow_exports), data_retention_policies.  
  - Admin panels (governance, trust) expose calibration, alerts, and AI governance.  
- **Recommendations:**  
  - **Centralize:** Single “Tenant settings” or “Governance” section for: subscription, privacy (PII mode, exports), retention defaults, feature flags (if any).  
  - **Audit:** Changes to governance settings (e.g. pii_mode, retention) should emit audit_logs.  
  - **Org override:** When org exists, document whether org admin can override tenant-level governance (e.g. max retention, enforce PII) and how.

---

## 4. Optional billing readiness

- **Current:**  
  - Billing-related code exists: e.g. Stripe checkout session, portal, webhook (apps/web/app/api/v1/billing/*); entitlements and subscription limits (FREE/PRO/ENTERPRISE) drive rate limits and caps.  
  - No full billing admin UI described in this audit; dashboard may link to billing/portal.  
- **Recommendations for enterprise billing readiness:**  
  - **Tenant billing:** Link from tenant admin to Stripe Customer portal (or equivalent) so owner can manage subscription and payment method.  
  - **Org billing:** If org is the billing entity, support org-level subscription and allocation of usage to tenants; document in product/billing spec.  
  - **Usage and limits:** Surface current usage (e.g. AI budget, storage) and limits in admin or settings; align with RELIABILITY_METRICS_AND_KPIS.  
  - **Invoicing and export:** For enterprise, support invoice export and usage reports; document in compliance/audit if needed.

---

## Control summary

| Area | Status | Notes |
|------|--------|--------|
| Org admin panel | Partial | Tenant admin exists; org admin API stubs; full UI and identity model to be completed |
| Role management UX | Partial | Tenant roles in DB and API; dedicated role-management UX to be clarified |
| Tenant governance settings | Implemented | Governance/trust/privacy in admin; centralize and audit changes |
| Billing readiness | Partial | Stripe and limits in place; org billing and usage UX optional for enterprise |
