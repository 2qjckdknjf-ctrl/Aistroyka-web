# Step 14 — Budget / Cost Governance Linkage

## 1. Scope

Step 14 does not add a financial approval engine. This doc describes the strongest justified linkage between budget/cost and existing governance (approvals, documents) at current maturity.

## 2. Current linkage

- **Milestone:** project_cost_items.milestone_id references project_milestones. Optional link from a cost line to a project milestone (schedule). No automatic approval when milestone is completed.
- **Created_by:** Cost item records who created it (audit). No "approver" or "reviewed_by" on cost items.
- **Documents / acts:** No FK from project_documents or approval events to project_cost_items. Documents and cost items are independent; both are project-scoped.

## 3. What we do not build

- No workflow that "requires approval before cost item create/update."
- No document type "invoice" or "act" that automatically creates or updates a cost item.
- No approval state on cost items (e.g. "pending_approval").

## 4. Lightweight options (current or future)

- **Manager-only mutability:** Only users who can manage projects can create/update cost items (canManageProjects). This is the only access control for cost changes.
- **Audit:** created_by and updated_at give a basic audit trail. Full audit_logs integration can be added later if needed.
- **Optional future:** Link document to cost item (e.g. document_id on project_cost_items or a join table) so that "Act #5" is associated with a cost line; not in Step 14 scope.

## 5. Conclusion

Governance linkage is **lightweight**: project/milestone scope, tenant RLS, and manager-only write. No approval workflow for budget changes in this phase. Document/act linkage is deferred.
