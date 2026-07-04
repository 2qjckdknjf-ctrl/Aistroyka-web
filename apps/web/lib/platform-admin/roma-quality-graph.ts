import type {
  RomaQualityGraph,
  RomaQualityGraphAffectedAnalysis,
  RomaQualityGraphChangeInput,
  RomaQualityGraphEdge,
  RomaQualityGraphNode,
  RomaQualityGraphNodeType,
  RomaQualityGraphReleaseGateImpact,
} from "./roma-quality-graph.types";

function node(
  partial: RomaQualityGraphNode
): RomaQualityGraphNode {
  return partial;
}

function edge(
  id: string,
  type: RomaQualityGraphEdge["type"],
  sourceId: string,
  targetId: string,
  label?: string
): RomaQualityGraphEdge {
  return { id, type, sourceId, targetId, label };
}

const NODES: RomaQualityGraphNode[] = [
  // Product areas
  node({ id: "pa-public-website", type: "product_area", label: "Public website", description: "Marketing and public entry surfaces.", criticality: "high" }),
  node({ id: "pa-web-dashboard", type: "product_area", label: "Web dashboard", description: "Contractor operational dashboard.", criticality: "critical" }),
  node({ id: "pa-platform-admin", type: "product_area", label: "Platform Admin", description: "Owner-only platform operations cabinet.", criticality: "critical" }),
  node({ id: "pa-roma-qa-center", type: "product_area", label: "ROMA QA Center", description: "Quality intelligence and graph inside Platform Admin.", criticality: "high" }),
  node({ id: "pa-worker-reports", type: "product_area", label: "Worker reports", description: "Field worker daily reports and photo capture.", criticality: "critical" }),
  node({ id: "pa-manager-review", type: "product_area", label: "Manager review", description: "Manager review and approval of field work.", criticality: "critical" }),
  node({ id: "pa-projects", type: "product_area", label: "Projects", description: "Project lifecycle and membership.", criticality: "critical" }),
  node({ id: "pa-tasks", type: "product_area", label: "Tasks", description: "Task assignment and completion.", criticality: "high" }),
  node({ id: "pa-documents", type: "product_area", label: "Documents", description: "Project document storage and sharing.", criticality: "high" }),
  node({ id: "pa-costs-budgets", type: "product_area", label: "Costs / budgets", description: "Internal cost tracking — not customer-facing finance.", criticality: "high" }),
  node({ id: "pa-notifications", type: "product_area", label: "Notifications", description: "Push and in-app notifications.", criticality: "medium" }),
  node({ id: "pa-ai-copilot", type: "product_area", label: "AI Copilot", description: "AI-assisted ops and vision features.", criticality: "high" }),
  node({ id: "pa-authentication", type: "product_area", label: "Authentication", description: "Login, session, and identity.", criticality: "critical" }),
  node({ id: "pa-tenant-isolation", type: "product_area", label: "Tenant isolation", description: "RLS and cross-tenant boundary enforcement.", criticality: "critical" }),
  node({ id: "pa-release-pipeline", type: "product_area", label: "Release pipeline", description: "Build, deploy, and release gates.", criticality: "critical" }),

  // Business flows
  node({ id: "bf-worker-submit-report", type: "business_flow", label: "Worker submits report", description: "Worker captures and syncs a field report." }),
  node({ id: "bf-manager-approve-report", type: "business_flow", label: "Manager approves report", description: "Manager reviews and approves worker submission." }),
  node({ id: "bf-project-onboarding", type: "business_flow", label: "Project onboarding", description: "Create project, invite members, configure access." }),
  node({ id: "bf-document-upload", type: "business_flow", label: "Document upload", description: "Upload and attach documents to a project." }),
  node({ id: "bf-ai-vision-analysis", type: "business_flow", label: "AI vision analysis", description: "Photo analysis via AI provider." }),
  node({ id: "bf-owner-platform-ops", type: "business_flow", label: "Owner platform ops", description: "Platform owner reviews quality and billing pilot." }),

  // App surfaces
  node({ id: "as-public-web", type: "app_surface", label: "Public web", description: "aistroyka.ai public site." }),
  node({ id: "as-tenant-dashboard", type: "app_surface", label: "Tenant dashboard", description: "Web dashboard for contractor ops." }),
  node({ id: "as-owner-portal", type: "app_surface", label: "Owner/client portal", description: "Stakeholder portal invitations." }),
  node({ id: "as-platform-admin", type: "app_surface", label: "Platform admin", description: "admin.aistroyka.ai owner cabinet." }),
  node({ id: "as-android-manager", type: "app_surface", label: "Android Manager", description: "Android Manager app surface." }),
  node({ id: "as-android-worker", type: "app_surface", label: "Android Worker", description: "Android Worker app surface." }),
  node({ id: "as-ios-manager", type: "app_surface", label: "iOS Manager", description: "iOS Manager app surface." }),
  node({ id: "as-ios-worker", type: "app_surface", label: "iOS Worker", description: "iOS Worker app surface." }),

  // Roles
  node({ id: "role-platform-owner", type: "role", label: "Platform owner", description: "Global platform operator." }),
  node({ id: "role-tenant-owner", type: "role", label: "Tenant owner", description: "Contractor company owner." }),
  node({ id: "role-tenant-admin", type: "role", label: "Tenant admin", description: "Company admin — not platform admin." }),
  node({ id: "role-manager", type: "role", label: "Manager", description: "Site/project manager." }),
  node({ id: "role-foreman", type: "role", label: "Foreman", description: "Field foreman role." }),
  node({ id: "role-worker", type: "role", label: "Worker", description: "Field worker." }),
  node({ id: "role-client", type: "role", label: "Client", description: "Customer/client stakeholder." }),
  node({ id: "role-stakeholder", type: "role", label: "Stakeholder", description: "Invited portal stakeholder." }),

  // APIs
  node({ id: "api-health", type: "api", label: "Health", description: "GET /api/v1/health", criticality: "critical" }),
  node({ id: "api-auth-session", type: "api", label: "Auth / session", description: "Supabase auth and session APIs.", criticality: "critical" }),
  node({ id: "api-platform-admin", type: "api", label: "Platform admin APIs", description: "/api/v1/platform/* owner-gated APIs.", criticality: "critical" }),
  node({ id: "api-reports", type: "api", label: "Reports APIs", description: "Field report sync and CRUD.", criticality: "critical" }),
  node({ id: "api-projects", type: "api", label: "Projects APIs", description: "Project and membership APIs.", criticality: "critical" }),
  node({ id: "api-documents", type: "api", label: "Documents APIs", description: "Document metadata and access.", criticality: "high" }),
  node({ id: "api-costs", type: "api", label: "Costs APIs", description: "Internal cost/budget APIs.", criticality: "high" }),
  node({ id: "api-ai", type: "api", label: "AI APIs", description: "Copilot and vision endpoints.", criticality: "high" }),
  node({ id: "api-upload-storage", type: "api", label: "Upload / storage APIs", description: "File upload and storage access.", criticality: "critical" }),
  node({ id: "api-feature-flags", type: "api", label: "Feature flags", description: "Global and tenant feature flags.", criticality: "high" }),
  node({ id: "api-jobs-cron", type: "api", label: "Jobs / cron", description: "Background jobs and scheduled tasks.", criticality: "high" }),

  // Database & infrastructure
  node({ id: "db-supabase", type: "database", label: "Supabase Postgres", description: "Primary database with RLS.", criticality: "critical" }),
  node({ id: "infra-cloudflare-worker", type: "infrastructure", label: "Cloudflare Worker", description: "Production web runtime.", criticality: "critical" }),
  node({ id: "infra-supabase-storage", type: "infrastructure", label: "Supabase Storage", description: "Object storage for uploads.", criticality: "critical" }),

  // Mobile apps
  node({ id: "mobile-android-manager", type: "mobile_app", label: "Android Manager", description: "Android Manager binary.", criticality: "medium" }),
  node({ id: "mobile-android-worker", type: "mobile_app", label: "Android Worker", description: "Android Worker binary.", criticality: "medium" }),
  node({ id: "mobile-ios-manager", type: "mobile_app", label: "iOS Manager", description: "iOS Manager binary — primary mobile contour.", criticality: "high" }),
  node({ id: "mobile-ios-worker", type: "mobile_app", label: "iOS Worker", description: "iOS Worker binary — primary mobile contour.", criticality: "high" }),

  // AI capabilities
  node({ id: "ai-copilot", type: "ai_capability", label: "Copilot", description: "Streaming copilot assistant." }),
  node({ id: "ai-vision", type: "ai_capability", label: "Vision analysis", description: "Image/photo AI analysis." }),

  // Integrations
  node({ id: "int-stripe", type: "integration", label: "Stripe", description: "Billing and subscriptions." }),
  node({ id: "int-telegram", type: "integration", label: "Telegram", description: "Optional Telegram auth bot." }),

  // Test domains
  node({ id: "td-web-e2e", type: "test_domain", label: "Web E2E", description: "Playwright dashboard and public flows." }),
  node({ id: "td-backend-api", type: "test_domain", label: "Backend API", description: "API contract and integration tests." }),
  node({ id: "td-mobile-android", type: "test_domain", label: "Mobile Android", description: "Android instrumented and smoke tests." }),
  node({ id: "td-mobile-ios", type: "test_domain", label: "Mobile iOS", description: "iOS UITest and E2E smoke." }),
  node({ id: "td-ai-safety", type: "test_domain", label: "AI safety", description: "Prompt injection and leakage checks." }),
  node({ id: "td-security-rbac", type: "test_domain", label: "Security / RBAC", description: "Role boundary and isolation audits." }),
  node({ id: "td-performance", type: "test_domain", label: "Performance", description: "CWV, latency, mobile perf." }),
  node({ id: "td-accessibility", type: "test_domain", label: "Accessibility", description: "A11y conformance checks." }),
  node({ id: "td-visual-design", type: "test_domain", label: "Visual / design", description: "Design regression and visual QA." }),
  node({ id: "td-release-smoke", type: "test_domain", label: "Release smoke", description: "Preflight health and deploy truth." }),

  // Risks
  node({ id: "risk-auth-broken", type: "risk", label: "Auth broken", description: "Users cannot sign in or sessions fail.", criticality: "critical" }),
  node({ id: "risk-tenant-leakage", type: "risk", label: "Tenant leakage", description: "Cross-tenant data exposure.", criticality: "critical" }),
  node({ id: "risk-platform-admin-exposure", type: "risk", label: "Platform admin exposure", description: "Non-owner reaches platform admin.", criticality: "critical" }),
  node({ id: "risk-worker-upload-broken", type: "risk", label: "Worker report upload broken", description: "Field reports fail to sync.", criticality: "critical" }),
  node({ id: "risk-manager-review-broken", type: "risk", label: "Manager review broken", description: "Managers cannot approve reports.", criticality: "critical" }),
  node({ id: "risk-ai-leakage", type: "risk", label: "AI leakage", description: "Internal finance or secrets leak via AI.", criticality: "critical" }),
  node({ id: "risk-storage-unavailable", type: "risk", label: "Storage unavailable", description: "Uploads and documents fail.", criticality: "critical" }),
  node({ id: "risk-migration-drift", type: "risk", label: "Migration drift", description: "Repo vs live schema mismatch.", criticality: "high" }),
  node({ id: "risk-release-pipeline-broken", type: "risk", label: "Release pipeline broken", description: "Deploy or CI chain fails.", criticality: "critical" }),
  node({ id: "risk-mobile-parity-broken", type: "risk", label: "Mobile parity broken", description: "Mobile apps diverge from API contract.", criticality: "high" }),

  // Release gates
  node({ id: "rg-staging-deploy", type: "release_gate", label: "Staging deploy verified", description: "buildStamp on staging.", criticality: "critical" }),
  node({ id: "rg-production-deploy", type: "release_gate", label: "Production deploy verified", description: "buildStamp on production.", criticality: "critical" }),
  node({ id: "rg-platform-admin-access", type: "release_gate", label: "Platform admin access audit", description: "Owner-only Access + grants.", criticality: "critical" }),
  node({ id: "rg-ai-live-gate", type: "release_gate", label: "AI live provider gate", description: "ai_live_provider.sh --require-live.", criticality: "high" }),
  node({ id: "rg-pilot-smoke", type: "release_gate", label: "Pilot smoke", description: "Scoped pilot E2E and role smoke.", criticality: "high" }),
];

const EDGES: RomaQualityGraphEdge[] = [
  // Product area → business flow
  edge("e-pa-wr-bf", "owns", "pa-worker-reports", "bf-worker-submit-report"),
  edge("e-pa-mr-bf", "owns", "pa-manager-review", "bf-manager-approve-report"),
  edge("e-pa-proj-bf", "owns", "pa-projects", "bf-project-onboarding"),
  edge("e-pa-doc-bf", "owns", "pa-documents", "bf-document-upload"),
  edge("e-pa-ai-bf", "owns", "pa-ai-copilot", "bf-ai-vision-analysis"),
  edge("e-pa-pa-bf", "owns", "pa-platform-admin", "bf-owner-platform-ops"),

  // Business flow → API
  edge("e-bf-wr-api", "depends_on", "bf-worker-submit-report", "api-reports"),
  edge("e-bf-wr-storage", "depends_on", "bf-worker-submit-report", "api-upload-storage"),
  edge("e-bf-mr-api", "depends_on", "bf-manager-approve-report", "api-reports"),
  edge("e-bf-proj-api", "depends_on", "bf-project-onboarding", "api-projects"),
  edge("e-bf-doc-api", "depends_on", "bf-document-upload", "api-documents"),
  edge("e-bf-doc-storage", "depends_on", "bf-document-upload", "api-upload-storage"),
  edge("e-bf-ai-api", "depends_on", "bf-ai-vision-analysis", "api-ai"),
  edge("e-bf-owner-api", "depends_on", "bf-owner-platform-ops", "api-platform-admin"),

  // App surface → product area
  edge("e-as-pub-pa", "exposes", "as-public-web", "pa-public-website"),
  edge("e-as-dash-pa", "exposes", "as-tenant-dashboard", "pa-web-dashboard"),
  edge("e-as-portal-pa", "exposes", "as-owner-portal", "pa-projects"),
  edge("e-as-padmin-pa", "exposes", "as-platform-admin", "pa-platform-admin"),
  edge("e-as-padmin-roma", "exposes", "as-platform-admin", "pa-roma-qa-center"),
  edge("e-as-ios-w-pa", "exposes", "as-ios-worker", "pa-worker-reports"),
  edge("e-as-ios-m-pa", "exposes", "as-ios-manager", "pa-manager-review"),
  edge("e-as-and-w-pa", "exposes", "as-android-worker", "pa-worker-reports"),
  edge("e-as-and-m-pa", "exposes", "as-android-manager", "pa-manager-review"),

  // Mobile app → app surface
  edge("e-mob-ios-w", "used_by", "mobile-ios-worker", "as-ios-worker"),
  edge("e-mob-ios-m", "used_by", "mobile-ios-manager", "as-ios-manager"),
  edge("e-mob-and-w", "used_by", "mobile-android-worker", "as-android-worker"),
  edge("e-mob-and-m", "used_by", "mobile-android-manager", "as-android-manager"),

  // API → database / infrastructure
  edge("e-api-db", "depends_on", "api-projects", "db-supabase"),
  edge("e-api-reports-db", "depends_on", "api-reports", "db-supabase"),
  edge("e-api-storage-infra", "depends_on", "api-upload-storage", "infra-supabase-storage"),
  edge("e-api-health-infra", "depends_on", "api-health", "infra-cloudflare-worker"),
  edge("e-padmin-auth", "depends_on", "api-platform-admin", "api-auth-session"),

  // Roles → product areas (used_by)
  edge("e-role-owner-pa", "used_by", "role-platform-owner", "pa-platform-admin"),
  edge("e-role-owner-roma", "used_by", "role-platform-owner", "pa-roma-qa-center"),
  edge("e-role-worker-wr", "used_by", "role-worker", "pa-worker-reports"),
  edge("e-role-mgr-mr", "used_by", "role-manager", "pa-manager-review"),
  edge("e-role-admin-dash", "used_by", "role-tenant-admin", "pa-web-dashboard"),
  edge("e-role-stake-portal", "used_by", "role-stakeholder", "pa-projects"),

  // AI capability
  edge("e-ai-pa", "exposes", "ai-copilot", "pa-ai-copilot"),
  edge("e-ai-vision-pa", "exposes", "ai-vision", "pa-ai-copilot"),
  edge("e-ai-api", "depends_on", "ai-copilot", "api-ai"),

  // Tenant isolation
  edge("e-ti-db", "observes", "pa-tenant-isolation", "db-supabase"),
  edge("e-ti-api", "observes", "pa-tenant-isolation", "api-projects"),

  // Auth
  edge("e-auth-pa", "blocks", "pa-authentication", "pa-web-dashboard"),
  edge("e-auth-api", "depends_on", "pa-authentication", "api-auth-session"),

  // Risks ↔ product areas (affected_by)
  edge("e-risk-auth-pa", "affected_by", "risk-auth-broken", "pa-authentication"),
  edge("e-risk-leak-ti", "affected_by", "risk-tenant-leakage", "pa-tenant-isolation"),
  edge("e-risk-padmin-pa", "affected_by", "risk-platform-admin-exposure", "pa-platform-admin"),
  edge("e-risk-wr-upload", "affected_by", "risk-worker-upload-broken", "pa-worker-reports"),
  edge("e-risk-mr-review", "affected_by", "risk-manager-review-broken", "pa-manager-review"),
  edge("e-risk-ai-leak", "affected_by", "risk-ai-leakage", "pa-ai-copilot"),
  edge("e-risk-storage-doc", "affected_by", "risk-storage-unavailable", "pa-documents"),
  edge("e-risk-storage-wr", "affected_by", "risk-storage-unavailable", "pa-worker-reports"),
  edge("e-risk-migration-db", "affected_by", "risk-migration-drift", "db-supabase"),
  edge("e-risk-release-pipe", "affected_by", "risk-release-pipeline-broken", "pa-release-pipeline"),
  edge("e-risk-mobile-parity", "affected_by", "risk-mobile-parity-broken", "pa-worker-reports"),

  // Test domains validate product areas
  edge("e-td-web-dash", "validates", "td-web-e2e", "pa-web-dashboard"),
  edge("e-td-web-pub", "validates", "td-web-e2e", "pa-public-website"),
  edge("e-td-api-proj", "validates", "td-backend-api", "api-projects"),
  edge("e-td-api-reports", "validates", "td-backend-api", "api-reports"),
  edge("e-td-ios-wr", "validates", "td-mobile-ios", "pa-worker-reports"),
  edge("e-td-and-wr", "validates", "td-mobile-android", "pa-worker-reports"),
  edge("e-td-ai-copilot", "validates", "td-ai-safety", "pa-ai-copilot"),
  edge("e-td-sec-padmin", "validates", "td-security-rbac", "pa-platform-admin"),
  edge("e-td-sec-ti", "validates", "td-security-rbac", "pa-tenant-isolation"),
  edge("e-td-release-pipe", "validates", "td-release-smoke", "pa-release-pipeline"),
  edge("e-td-perf-web", "validates", "td-performance", "pa-web-dashboard"),

  // Release gates require product areas / test domains
  edge("e-rg-staging", "requires", "rg-staging-deploy", "pa-release-pipeline"),
  edge("e-rg-prod", "requires", "rg-production-deploy", "pa-release-pipeline"),
  edge("e-rg-padmin", "requires", "rg-platform-admin-access", "pa-platform-admin"),
  edge("e-rg-ai", "requires", "rg-ai-live-gate", "pa-ai-copilot"),
  edge("e-rg-pilot", "requires", "rg-pilot-smoke", "pa-web-dashboard"),

  // Mitigations
  edge("e-sec-mit-padmin", "mitigates", "td-security-rbac", "risk-platform-admin-exposure"),
  edge("e-sec-mit-leak", "mitigates", "td-security-rbac", "risk-tenant-leakage"),
  edge("e-ai-mit-leak", "mitigates", "td-ai-safety", "risk-ai-leakage"),
  edge("e-api-mit-upload", "mitigates", "td-backend-api", "risk-worker-upload-broken"),
];

const REQUIRED_NODE_TYPES: RomaQualityGraphNodeType[] = [
  "product_area",
  "business_flow",
  "app_surface",
  "api",
  "database",
  "role",
  "mobile_app",
  "ai_capability",
  "test_domain",
  "risk",
  "release_gate",
];

/** Path prefix → product area IDs (deterministic V1 mapping). */
const PATH_TO_AREAS: readonly { match: (path: string) => boolean; areaIds: readonly string[] }[] = [
  {
    match: (p) => /platform-admin|platform.owner|platform_owner/i.test(p),
    areaIds: ["pa-platform-admin", "pa-roma-qa-center"],
  },
  {
    match: (p) => /worker.*report|reports\/|field-report|daily-report/i.test(p),
    areaIds: ["pa-worker-reports"],
  },
  {
    match: (p) => /manager.*review|approve.*report/i.test(p),
    areaIds: ["pa-manager-review"],
  },
  {
    match: (p) => /copilot|\/ai\/|vision|openai|llm/i.test(p),
    areaIds: ["pa-ai-copilot"],
  },
  {
    match: (p) => /middleware|auth|login|session|supabase\/auth/i.test(p),
    areaIds: ["pa-authentication"],
  },
  {
    match: (p) => /rls|tenant.isol|platform_owner_grants|break_glass/i.test(p),
    areaIds: ["pa-tenant-isolation", "pa-platform-admin"],
  },
  {
    match: (p) => /upload|storage|bucket/i.test(p),
    areaIds: ["pa-documents", "pa-worker-reports"],
  },
  {
    match: (p) => /project/i.test(p),
    areaIds: ["pa-projects"],
  },
  {
    match: (p) => /document/i.test(p),
    areaIds: ["pa-documents"],
  },
  {
    match: (p) => /cost|budget/i.test(p),
    areaIds: ["pa-costs-budgets"],
  },
  {
    match: (p) => /wrangler|deploy|cloudflare|\.github\/workflows/i.test(p),
    areaIds: ["pa-release-pipeline"],
  },
  {
    match: (p) => /^ios\//i.test(p) || /ios\/Shared/i.test(p),
    areaIds: ["pa-worker-reports", "pa-manager-review"],
  },
  {
    match: (p) => /^android\//i.test(p),
    areaIds: ["pa-worker-reports", "pa-manager-review"],
  },
  {
    match: (p) => /\(public\)|public-site|marketing/i.test(p),
    areaIds: ["pa-public-website"],
  },
  {
    match: (p) => /\(dashboard\)|dashboard\//i.test(p),
    areaIds: ["pa-web-dashboard"],
  },
];

const MODULE_TO_AREAS: Record<string, readonly string[]> = {
  "platform-admin": ["pa-platform-admin", "pa-roma-qa-center"],
  reports: ["pa-worker-reports"],
  copilot: ["pa-ai-copilot"],
  auth: ["pa-authentication"],
  storage: ["pa-documents", "pa-worker-reports"],
  projects: ["pa-projects"],
};

const API_TO_AREAS: Record<string, readonly string[]> = {
  "api-health": ["pa-release-pipeline"],
  "api-auth-session": ["pa-authentication"],
  "api-platform-admin": ["pa-platform-admin"],
  "api-reports": ["pa-worker-reports", "pa-manager-review"],
  "api-projects": ["pa-projects"],
  "api-documents": ["pa-documents"],
  "api-costs": ["pa-costs-budgets"],
  "api-ai": ["pa-ai-copilot"],
  "api-upload-storage": ["pa-documents", "pa-worker-reports"],
  "api-feature-flags": ["pa-web-dashboard"],
  "api-jobs-cron": ["pa-release-pipeline"],
};

const AREA_TEST_DOMAINS: Record<string, readonly string[]> = {
  "pa-public-website": ["td-web-e2e", "td-performance", "td-accessibility"],
  "pa-web-dashboard": ["td-web-e2e", "td-backend-api", "td-security-rbac", "td-performance"],
  "pa-platform-admin": ["td-security-rbac", "td-release-smoke"],
  "pa-roma-qa-center": ["td-security-rbac"],
  "pa-worker-reports": ["td-mobile-ios", "td-mobile-android", "td-backend-api", "td-release-smoke"],
  "pa-manager-review": ["td-mobile-ios", "td-mobile-android", "td-backend-api"],
  "pa-projects": ["td-web-e2e", "td-backend-api", "td-security-rbac"],
  "pa-tasks": ["td-web-e2e", "td-backend-api"],
  "pa-documents": ["td-backend-api", "td-web-e2e"],
  "pa-costs-budgets": ["td-backend-api", "td-security-rbac"],
  "pa-notifications": ["td-backend-api"],
  "pa-ai-copilot": ["td-ai-safety", "td-backend-api", "td-security-rbac"],
  "pa-authentication": ["td-web-e2e", "td-security-rbac", "td-backend-api"],
  "pa-tenant-isolation": ["td-security-rbac", "td-backend-api"],
  "pa-release-pipeline": ["td-release-smoke", "td-backend-api"],
};

const AREA_RISKS: Record<string, readonly string[]> = {
  "pa-authentication": ["risk-auth-broken"],
  "pa-tenant-isolation": ["risk-tenant-leakage"],
  "pa-platform-admin": ["risk-platform-admin-exposure", "risk-tenant-leakage"],
  "pa-worker-reports": ["risk-worker-upload-broken", "risk-storage-unavailable", "risk-mobile-parity-broken"],
  "pa-manager-review": ["risk-manager-review-broken", "risk-mobile-parity-broken"],
  "pa-ai-copilot": ["risk-ai-leakage"],
  "pa-documents": ["risk-storage-unavailable"],
  "pa-release-pipeline": ["risk-release-pipeline-broken", "risk-migration-drift"],
  "pa-roma-qa-center": ["risk-platform-admin-exposure"],
};

const AREA_RELEASE_GATES: Record<string, readonly string[]> = {
  "pa-platform-admin": ["rg-platform-admin-access"],
  "pa-release-pipeline": ["rg-staging-deploy", "rg-production-deploy"],
  "pa-ai-copilot": ["rg-ai-live-gate"],
  "pa-web-dashboard": ["rg-pilot-smoke"],
};

let cachedGraph: RomaQualityGraph | null = null;

export function getQualityGraph(): RomaQualityGraph {
  if (cachedGraph) return cachedGraph;
  cachedGraph = {
    version: "v1",
    executionEnabled: false,
    generatedAt: "2026-07-04T00:00:00.000Z",
    nodes: NODES,
    edges: EDGES,
  };
  return cachedGraph;
}

export function getRequiredNodeTypes(): readonly RomaQualityGraphNodeType[] {
  return REQUIRED_NODE_TYPES;
}

export function getNodesByType(type: RomaQualityGraphNodeType): RomaQualityGraphNode[] {
  return getQualityGraph().nodes.filter((n) => n.type === type);
}

export function getNodeById(id: string): RomaQualityGraphNode | undefined {
  return getQualityGraph().nodes.find((n) => n.id === id);
}

export function getEdgesForNode(nodeId: string): RomaQualityGraphEdge[] {
  return getQualityGraph().edges.filter((e) => e.sourceId === nodeId || e.targetId === nodeId);
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

function collectRelatedIds(
  areaIds: readonly string[],
  edgeType: RomaQualityGraphEdge["type"],
  targetNodeType: RomaQualityGraphNodeType,
  direction: "outgoing" | "incoming"
): string[] {
  const graph = getQualityGraph();
  const nodeTypeById = new Map(graph.nodes.map((n) => [n.id, n.type]));
  const results: string[] = [];

  for (const areaId of areaIds) {
    for (const e of graph.edges) {
      if (e.type !== edgeType) continue;
      if (direction === "outgoing" && e.sourceId === areaId) {
        const t = nodeTypeById.get(e.targetId);
        if (t === targetNodeType) results.push(e.targetId);
      }
      if (direction === "incoming" && e.targetId === areaId) {
        const t = nodeTypeById.get(e.sourceId);
        if (t === targetNodeType) results.push(e.sourceId);
      }
    }
  }
  return uniqueIds(results);
}

export function getAffectedAreasForChange(input: RomaQualityGraphChangeInput): readonly string[] {
  const areaIds: string[] = [];

  for (const path of input.changedPaths) {
    for (const rule of PATH_TO_AREAS) {
      if (rule.match(path)) areaIds.push(...rule.areaIds);
    }
  }

  for (const mod of input.changedModules ?? []) {
    const key = mod.toLowerCase();
    for (const [pattern, ids] of Object.entries(MODULE_TO_AREAS)) {
      if (key.includes(pattern)) areaIds.push(...ids);
    }
  }

  for (const api of input.changedApis ?? []) {
    const ids = API_TO_AREAS[api];
    if (ids) areaIds.push(...ids);
  }

  return uniqueIds(areaIds);
}

export function getRequiredTestDomainsForAffectedAreas(areaIds: readonly string[]): readonly string[] {
  const domains: string[] = [];
  for (const areaId of areaIds) {
    const mapped = AREA_TEST_DOMAINS[areaId];
    if (mapped) domains.push(...mapped);
  }
  return uniqueIds(domains);
}

export function getRisksForAffectedAreas(areaIds: readonly string[]): readonly string[] {
  const risks: string[] = [];
  for (const areaId of areaIds) {
    const mapped = AREA_RISKS[areaId];
    if (mapped) risks.push(...mapped);
  }
  return uniqueIds(risks);
}

export function getReleaseGateImpact(areaIds: readonly string[]): RomaQualityGraphReleaseGateImpact {
  const gateIds: string[] = [];
  for (const areaId of areaIds) {
    const mapped = AREA_RELEASE_GATES[areaId];
    if (mapped) gateIds.push(...mapped);
  }
  const uniqueGates = uniqueIds(gateIds);

  const criticalAreas = areaIds.filter((id) => {
    const node = getNodeById(id);
    return node?.criticality === "critical";
  });

  let confidenceImpact: RomaQualityGraphReleaseGateImpact["confidenceImpact"] = "none";
  const notes: string[] = [];

  if (criticalAreas.length > 0) {
    confidenceImpact = criticalAreas.length >= 2 ? "high" : "medium";
    notes.push(`${criticalAreas.length} critical product area(s) affected.`);
  } else if (areaIds.length > 0) {
    confidenceImpact = "low";
    notes.push(`${areaIds.length} non-critical product area(s) affected.`);
  }

  if (uniqueGates.includes("rg-platform-admin-access")) {
    notes.push("Platform admin access gate may require re-verification.");
  }
  if (uniqueGates.includes("rg-ai-live-gate")) {
    notes.push("AI live provider gate may be required before release.");
  }

  return {
    gateIds: uniqueGates,
    blockedGates: [],
    confidenceImpact,
    notes,
  };
}

export function analyzeChangeImpact(input: RomaQualityGraphChangeInput): RomaQualityGraphAffectedAnalysis {
  const productAreaIds = getAffectedAreasForChange(input);
  const testDomainIds = getRequiredTestDomainsForAffectedAreas(productAreaIds);
  const riskIds = getRisksForAffectedAreas(productAreaIds);
  const releaseImpact = getReleaseGateImpact(productAreaIds);

  const roleIds = collectRelatedIds(productAreaIds, "used_by", "role", "incoming");
  const apiIds = collectRelatedIds(productAreaIds, "depends_on", "api", "outgoing");
  const mobileAppIds = getQualityGraph()
    .nodes.filter((n) => n.type === "mobile_app")
    .filter((n) => {
      const surfaces = collectRelatedIds([n.id], "used_by", "app_surface", "outgoing");
      return surfaces.some((surfaceId) =>
        productAreaIds.some((areaId) =>
          getQualityGraph().edges.some(
            (e) => e.type === "exposes" && e.sourceId === surfaceId && e.targetId === areaId
          )
        )
      );
    })
    .map((n) => n.id);

  const summary =
    productAreaIds.length === 0
      ? "No mapped product areas for the supplied change input."
      : `Change affects ${productAreaIds.length} product area(s), ${riskIds.length} risk(s), ${testDomainIds.length} test domain(s). Release confidence impact: ${releaseImpact.confidenceImpact}.`;

  return {
    productAreaIds,
    roleIds,
    apiIds,
    mobileAppIds,
    testDomainIds,
    riskIds,
    releaseGateIds: releaseImpact.gateIds,
    releaseConfidenceImpact: releaseImpact.confidenceImpact,
    summary,
  };
}

/** Example change paths for V1 UI demonstration (not live git). */
export const ROMA_QUALITY_GRAPH_EXAMPLE_CHANGES: readonly RomaQualityGraphChangeInput[] = [
  {
    changedPaths: ["apps/web/lib/platform-admin/roma-quality-dashboard.service.ts"],
    changedModules: ["platform-admin"],
  },
  {
    changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/Sync/ReportSync.swift"],
    changedApis: ["api-reports", "api-upload-storage"],
  },
  {
    changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
    changedApis: ["api-ai"],
  },
];

export function getGraphSummary(): {
  nodeCount: number;
  edgeCount: number;
  countsByType: Record<RomaQualityGraphNodeType, number>;
  criticalProductAreas: RomaQualityGraphNode[];
  highRisks: RomaQualityGraphNode[];
} {
  const graph = getQualityGraph();
  const countsByType = {} as Record<RomaQualityGraphNodeType, number>;
  for (const type of REQUIRED_NODE_TYPES) {
    countsByType[type] = 0;
  }
  for (const n of graph.nodes) {
    countsByType[n.type] = (countsByType[n.type] ?? 0) + 1;
  }
  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    countsByType,
    criticalProductAreas: graph.nodes.filter(
      (n) => n.type === "product_area" && (n.criticality === "critical" || n.criticality === "high")
    ),
    highRisks: graph.nodes.filter(
      (n) => n.type === "risk" && (n.criticality === "critical" || n.criticality === "high")
    ),
  };
}
