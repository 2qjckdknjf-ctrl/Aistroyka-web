# Plan entitlement matrix

Canonical defaults per plan. Source: `apps/web/lib/platform/plan-fit/entitlements-config.ts`.

## Limits

| Plan                 | maxUsers | maxProjects | maxStorageGb | maxActiveMobileWorkers | maxMonthlyAiRequests |
|---------------------|----------|-------------|--------------|------------------------|----------------------|
| client_personal     | 2        | 2           | 10           | 0                      | 100                  |
| team_contractor     | 20       | 15          | 100          | 20                     | 2000                 |
| business_operations | 100      | 100         | 500          | 100                    | 10000                |
| enterprise          | 5000     | 500         | 2000         | 500                    | 100000               |

## Capabilities (by plan)

### client_personal

**On:** projects, phasesMilestones, photoEvidence, commentsMentions, notifications, decisionLog, basicDashboard, summaryGeneration, approvals, documents, inspections (basic), defectsIssues (basic).

**Off:** tasks (client persona — no full contractor execution flow), advancedApprovals, advancedDocuments, roleHierarchy, customRoles, approvalChains, projectHealthSignals, riskSignals, managerAi, advancedAnalytics, portfolioAnalytics, multipleWorkspaces, sso, auditLogs, integrations, apiAccess, sla, assistedOnboarding, prioritySupport, whiteGlove.

### team_contractor

**On:** projects, phasesMilestones, tasks, dailyReports, photoEvidence, commentsMentions, notifications, defectsIssues, inspections (basic), approvals, documents, basicDashboard, summaryGeneration, managerAi (basic), riskSignals (limited).

**Off:** advancedApprovals, advancedDocuments, roleHierarchy, customRoles, approvalChains, advancedAnalytics, portfolioAnalytics (see note), sso, auditLogs, apiAccess (default).

**Note:** portfolioAnalytics is **false** for team_contractor; available from business_operations upward. Documented in PLAN_FIT_FOUNDATION.md.

### business_operations

**On:** All team_contractor capabilities plus: advancedApprovals, advancedDocuments, recheckFlow, decisionLog, roleHierarchy, customRoles, approvalChains, projectHealthSignals, riskSignals, managerAi (full), advancedAnalytics, portfolioAnalytics, assistedOnboarding, integrations (selected/phased), apiAccess (controlled).

**Off (default):** sso, sla, whiteGlove.

### enterprise

**On:** All business_operations plus: sso, auditLogs, integrations (full), apiAccess (full), sla, prioritySupport, whiteGlove, multipleWorkspaces.

Enterprise limits are custom/sentinel (high numbers); real values may come from contract.
