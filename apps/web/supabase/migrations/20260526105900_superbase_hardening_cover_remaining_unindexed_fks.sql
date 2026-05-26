create index if not exists idx_ai_chat_messages_project_id
  on public.ai_chat_messages(project_id);

create index if not exists idx_ai_chat_threads_project_id
  on public.ai_chat_threads(project_id);

create index if not exists idx_customer_estimates_project_id
  on public.customer_estimates(project_id);

create index if not exists idx_governance_case_projects_project_id
  on public.governance_case_projects(project_id);

create index if not exists idx_manager_notifications_user_id
  on public.manager_notifications(user_id);

create index if not exists idx_organization_tenants_tenant_id
  on public.organization_tenants(tenant_id);

create index if not exists idx_project_change_orders_project_id
  on public.project_change_orders(project_id);

create index if not exists idx_project_commercial_items_project_id
  on public.project_commercial_items(project_id);

create index if not exists idx_project_defects_project_id
  on public.project_defects(project_id);

create index if not exists idx_project_stakeholder_discussions_project_id
  on public.project_stakeholder_discussions(project_id);

create index if not exists idx_proof_pack_shares_project_id
  on public.proof_pack_shares(project_id);

create index if not exists idx_role_permissions_permission_id
  on public.role_permissions(permission_id);

create index if not exists idx_stakeholder_notifications_project_id
  on public.stakeholder_notifications(project_id);

create index if not exists idx_stakeholder_notifications_recipient_user_id
  on public.stakeholder_notifications(recipient_user_id);

create index if not exists idx_task_assignments_task_id
  on public.task_assignments(task_id);

create index if not exists idx_tenant_contractor_profiles_user_id
  on public.tenant_contractor_profiles(user_id);

create index if not exists idx_tenant_feature_flags_key
  on public.tenant_feature_flags(key);
