# Plan recommendation rules

Canonical rules for `recommendPlan(input)`. Implementation: `apps/web/lib/platform/plan-fit/recommend.ts`.

## Input

- **personaType:** client | contractor | developer_owner | supervisor | other
- **expectedUsersRange:** 1 | 2_5 | 6_20 | 21_100 | 100_plus
- **expectedProjectsRange:** 1 | 2_5 | 6_20 | 20_plus
- **priorities:** execution_control, reports_photo, schedule_control, approvals_documents, quality_defects, owner_visibility, ai_insights
- **needsMobileWorkforce:** boolean
- **needsFormalProcesses:** boolean
- **startMode:** self_serve | guided_setup | demo

## Output

- **recommendedPlanCode:** primary recommendation
- **alternativePlanCodes:** other plans (always 3; no hard lock)
- **enterpriseSignal:** true when enterprise is recommended or scale suggests enterprise
- **reasoningCodes:** machine-readable reasons (e.g. scale_100_plus_users, contractor_mobile_workforce)

## Rules (evaluation order)

1. **Enterprise**
   - 100_plus users → enterprise
   - 21_100 users + startMode demo → enterprise
   - 21_100 users + needsFormalProcesses → enterprise

2. **Business operations**
   - (supervisor | developer_owner) + multi-project (6_20 or 20_plus) + governance (formal processes or priorities: approvals_documents, quality_defects, ai_insights) → business_operations
   - 6_20 users + 20_plus projects + governance → business_operations

3. **Team contractor**
   - contractor + (2_5 | 6_20) users + needsMobileWorkforce → team_contractor
   - (2_5 | 6_20) users + needsMobileWorkforce + (execution_control | reports_photo) → team_contractor

4. **Client personal**
   - (client | other) + small scale (1 | 2_5 users) + (1 | 2_5) projects + !needsMobileWorkforce + !needsFormalProcesses → client_personal
   - 1 user + 1 project + !needsMobileWorkforce → client_personal

5. **Defaults**
   - 21_100 users → business_operations
   - 6_20 users or 6_20/20_plus projects → team_contractor
   - Else → client_personal

## Design

- Recommendation is advisory; alternatives are always returned.
- All rules are covered by tests in `recommend.test.ts`.
