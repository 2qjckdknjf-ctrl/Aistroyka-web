//
//  ManagerAPI.swift
//  AiStroyka Manager
//
//  Manager-facing API: projects, tasks, reports, workers, ops. Uses shared APIClient and DTOs.
//

import Foundation
import Shared

enum ManagerAPI {

    /// GET /api/v1/me — current user tenant + role for role gating.
    static func me() async throws -> MeResponse {
        try await APIClient.shared.request(path: "me")
    }

    /// Workspace title: GET `/tenant/profile`, then additive `GET /me.tenant_name`.
    static func resolvedWorkspaceName() async -> String? {
        if let name = try? await tenantProfile() {
            return name
        }
        if let me = try? await me() {
            let name = me.data?.tenantName?.trimmingCharacters(in: .whitespacesAndNewlines)
            if let name, !name.isEmpty { return name }
        }
        return nil
    }

    /// GET /api/v1/tenant/profile — workspace name.
    static func tenantProfile() async throws -> String? {
        struct Response: Decodable {
            let data: Payload?
            struct Payload: Decodable { let name: String? }
        }
        let r: Response = try await APIClient.shared.request(path: "tenant/profile")
        let name = r.data?.name?.trimmingCharacters(in: .whitespacesAndNewlines)
        return (name?.isEmpty == false) ? name : nil
    }

    /// PATCH /api/v1/tenant/profile — rename workspace (`tenant:settings`).
    static func updateTenantProfile(name: String) async throws -> String? {
        struct Body: Encodable { let name: String }
        struct Response: Decodable {
            let data: Payload?
            struct Payload: Decodable { let name: String? }
        }
        let r: Response = try await APIClient.shared.request(
            path: "tenant/profile",
            method: "PATCH",
            body: Body(name: name)
        )
        let updated = r.data?.name?.trimmingCharacters(in: .whitespacesAndNewlines)
        return (updated?.isEmpty == false) ? updated : name
    }

    static func documentFileURL(objectPath: String?) -> URL? {
        guard let objectPath, !objectPath.isEmpty else { return nil }
        let base = Config.supabaseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let trimmed = objectPath.hasPrefix("media/") ? String(objectPath.dropFirst("media/".count)) : objectPath
        return URL(string: "\(base)/storage/v1/object/public/media/\(trimmed)")
    }

    /// GET /api/v1/projects — list projects (tenant-scoped).
    static func projects() async throws -> [ProjectDTO] {
        let r: ProjectsResponse = try await APIClient.shared.request(path: "projects")
        return r.data ?? []
    }

    /// POST /api/v1/projects — create project (`CreateProjectRequestSchema`).
    static func createProject(name: String, idempotencyKey: String) async throws -> String {
        struct Body: Encodable { let name: String }
        struct Response: Decodable {
            let success: Bool?
            let data: Created?
            struct Created: Decodable { let id: String }
        }
        let r: Response = try await APIClient.shared.request(
            path: "projects",
            method: "POST",
            body: Body(name: name),
            idempotencyKey: idempotencyKey
        )
        guard let id = r.data?.id, !id.isEmpty else {
            throw APIError(statusCode: nil, code: nil, message: "No data")
        }
        return id
    }

    /// POST /api/v1/tenant/invite — email invite (`admin` | `member` | `viewer`).
    static func inviteTeammate(email: String, role: String) async throws {
        struct Body: Encodable { let email: String; let role: String }
        try await APIClient.shared.requestVoid(
            path: "tenant/invite",
            method: "POST",
            body: Body(email: email, role: role)
        )
    }

    /// GET /api/v1/tasks — list tasks. Query: project_id, from, to, status, q, limit, offset.
    static func tasks(
        projectId: String? = nil,
        status: String? = nil,
        from: String? = nil,
        to: String? = nil,
        query: String? = nil,
        limit: Int? = nil,
        offset: Int? = nil
    ) async throws -> [TaskDTO] {
        var components = [String]()
        if let id = projectId, !id.isEmpty { components.append("project_id=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)") }
        if let s = status, !s.isEmpty { components.append("status=\(s.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? s)") }
        if let from, !from.isEmpty { components.append("from=\(from)") }
        if let to, !to.isEmpty { components.append("to=\(to)") }
        if let query, !query.isEmpty {
            components.append("q=\(query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query)")
        }
        if let l = limit { components.append("limit=\(l)") }
        if let o = offset { components.append("offset=\(o)") }
        let queryString = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        let r: TasksListResponse = try await APIClient.shared.request(path: "tasks\(queryString)")
        return r.data ?? []
    }

    /// GET /api/v1/reports — list reports. Query: project_id, from, to, limit, status.
    static func reports(projectId: String? = nil, limit: Int? = nil) async throws -> [ReportListItemDTO] {
        var components = [String]()
        if let id = projectId, !id.isEmpty { components.append("project_id=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)") }
        if let l = limit { components.append("limit=\(l)") }
        let query = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        let r: ReportsListResponse = try await APIClient.shared.request(path: "reports\(query)")
        return r.data ?? []
    }

    /// GET /api/v1/ops/overview — KPIs and queues for dashboard.
    static func opsOverview(limit: Int? = nil, projectId: String? = nil) async throws -> OpsOverviewDTO {
        var components = [String]()
        if let l = limit { components.append("limit=\(l)") }
        if let id = projectId, !id.isEmpty { components.append("project_id=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)") }
        let query = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        return try await APIClient.shared.request(path: "ops/overview\(query)")
    }

    /// GET /api/v1/workers/:userId/summary — assigned/overdue/review counts.
    static func workerSummary(userId: String) async throws -> WorkerSummaryDTO {
        let r: WorkerSummaryResponse = try await APIClient.shared.request(path: "workers/\(userId)/summary")
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// GET /api/v1/workers — list workers with last activity (tenant-scoped).
    static func workers(limit: Int? = nil) async throws -> [WorkerRowDTO] {
        var path = "workers"
        if let l = limit { path += "?limit=\(l)" }
        let r: WorkersListResponse = try await APIClient.shared.request(path: path)
        return (r.data ?? []).filter { !$0.userId.isEmpty }
    }

    static func analysisStatus(reportId: String) async throws -> ManagerAnalysisStatusDTO {
        try await APIClient.shared.request(path: "reports/\(reportId)/analysis-status", keyDecoding: .useDefaultKeys)
    }

    /// GET /api/v1/reports/:id — report detail with media.
    static func reportDetail(id: String) async throws -> ReportDetailDTO {
        let r: ReportDetailResponse = try await APIClient.shared.request(path: "reports/\(id)")
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// PATCH /api/v1/reports/:id — manager review (approved / rejected / changes_requested). Optional manager_note.
    static func reportReview(reportId: String, status: String, managerNote: String?) async throws -> ReportDetailDTO {
        struct Body: Encodable {
            let status: String
            let managerNote: String?
            enum CodingKeys: String, CodingKey { case status; case managerNote = "manager_note" }
        }
        let r: ReportDetailResponse = try await APIClient.shared.request(
            path: "reports/\(reportId)",
            method: "PATCH",
            body: Body(status: status, managerNote: managerNote)
        )
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// GET /api/v1/tasks/:id — task detail.
    static func taskDetail(id: String) async throws -> TaskDetailDTO {
        let r: TaskDetailResponse = try await APIClient.shared.request(path: "tasks/\(id)")
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// POST /api/v1/tasks — create task.
    static func createTask(projectId: String, title: String, idempotencyKey: String) async throws -> TaskDetailDTO {
        try await createTask(
            projectId: projectId,
            title: title,
            description: nil,
            dueAt: nil,
            reportRequired: nil,
            requiredPhotos: nil,
            priority: nil,
            idempotencyKey: idempotencyKey
        )
    }

    /// POST /api/v1/tasks — create task with optional manager fields from CreateTaskInput.
    static func createTask(
        projectId: String,
        title: String,
        description: String?,
        dueAt: String?,
        reportRequired: Bool?,
        requiredPhotos: [String: Int]?,
        priority: String?,
        idempotencyKey: String
    ) async throws -> TaskDetailDTO {
        struct Body: Encodable {
            let projectId: String
            let title: String
            let description: String?
            let dueAt: String?
            let reportRequired: Bool?
            let requiredPhotos: [String: Int]?
            let priority: String?
            enum CodingKeys: String, CodingKey {
                case projectId = "project_id"
                case title
                case description
                case dueAt = "due_at"
                case reportRequired = "report_required"
                case requiredPhotos = "required_photos"
                case priority
            }

            func encode(to encoder: Encoder) throws {
                var container = encoder.container(keyedBy: CodingKeys.self)
                try container.encode(projectId, forKey: .projectId)
                try container.encode(title, forKey: .title)
                if let description { try container.encode(description, forKey: .description) }
                if let dueAt { try container.encode(dueAt, forKey: .dueAt) }
                if let reportRequired { try container.encode(reportRequired, forKey: .reportRequired) }
                if let requiredPhotos { try container.encode(requiredPhotos, forKey: .requiredPhotos) }
                if let priority { try container.encode(priority, forKey: .priority) }
            }
        }
        let r: TaskDetailResponse = try await APIClient.shared.request(
            path: "tasks",
            method: "POST",
            body: Body(
                projectId: projectId,
                title: title,
                description: description,
                dueAt: dueAt,
                reportRequired: reportRequired,
                requiredPhotos: requiredPhotos,
                priority: priority
            ),
            idempotencyKey: idempotencyKey
        )
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// GET /api/v1/projects/:id/documents
    static func projectDocuments(projectId: String) async throws -> [ProjectDocumentDTO] {
        let r: ProjectDocumentsResponse = try await APIClient.shared.request(path: "projects/\(projectId)/documents")
        return r.data ?? []
    }

    /// POST /api/v1/projects/:id/documents — create draft metadata row.
    static func createDocument(projectId: String, title: String, type: String, idempotencyKey: String) async throws -> String {
        struct Body: Encodable {
            let type: String
            let title: String
        }
        struct Response: Decodable {
            let data: Created?
            struct Created: Decodable { let id: String }
        }
        let r: Response = try await APIClient.shared.request(
            path: "projects/\(projectId)/documents",
            method: "POST",
            body: Body(type: type, title: title),
            idempotencyKey: idempotencyKey
        )
        guard let id = r.data?.id, !id.isEmpty else {
            throw APIError(statusCode: nil, code: nil, message: "No data")
        }
        return id
    }

    /// POST /api/v1/projects/:id/documents/:documentId/upload — multipart `file`.
    static func uploadDocumentFile(
        projectId: String,
        documentId: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        idempotencyKey: String
    ) async throws {
        try await APIClient.shared.uploadMultipartFile(
            path: "projects/\(projectId)/documents/\(documentId)/upload",
            fileData: fileData,
            fileName: fileName,
            mimeType: mimeType,
            idempotencyKey: idempotencyKey
        )
    }

    /// PATCH /api/v1/tasks/:id — same fields as cabinet (`UpdateTaskInput`).
    static func patchTask(
        taskId: String,
        status: String? = nil,
        title: String? = nil,
        description: String? = nil,
        dueAt: String? = nil,
        reportRequired: Bool? = nil,
        priority: String? = nil,
        idempotencyKey: String
    ) async throws {
        struct Body: Encodable {
            let status: String?
            let title: String?
            let description: String?
            let dueAt: String?
            let reportRequired: Bool?
            let priority: String?
            enum CodingKeys: String, CodingKey {
                case status, title, description
                case dueAt = "due_at"
                case reportRequired = "report_required"
                case priority
            }

            func encode(to encoder: Encoder) throws {
                var container = encoder.container(keyedBy: CodingKeys.self)
                if let status { try container.encode(status, forKey: .status) }
                if let title { try container.encode(title, forKey: .title) }
                if let description { try container.encode(description, forKey: .description) }
                if let dueAt { try container.encode(dueAt, forKey: .dueAt) }
                if let reportRequired { try container.encode(reportRequired, forKey: .reportRequired) }
                if let priority { try container.encode(priority, forKey: .priority) }
            }
        }
        try await APIClient.shared.requestVoid(
            path: "tasks/\(taskId)",
            method: "PATCH",
            body: Body(
                status: status,
                title: title,
                description: description,
                dueAt: dueAt,
                reportRequired: reportRequired,
                priority: priority
            ),
            idempotencyKey: idempotencyKey
        )
    }

    /// POST /api/v1/ai/risk-decisions — persist manager accept/assign/reject.
    static func submitRiskDecision(
        jobId: String,
        decision: String,
        comment: String?,
        title: String?
    ) async throws {
        struct Body: Encodable {
            let jobId: String
            let decision: String
            let comment: String?
            let title: String?
            enum CodingKeys: String, CodingKey {
                case jobId = "job_id"
                case decision, comment, title
            }
        }
        try await APIClient.shared.requestVoid(
            path: "ai/risk-decisions",
            method: "POST",
            body: Body(jobId: jobId, decision: decision, comment: comment, title: title)
        )
    }

    /// GET /api/v1/ai/risk-decisions
    static func riskDecisions(jobId: String? = nil) async throws -> [RiskDecisionDTO] {
        var path = "ai/risk-decisions?limit=100"
        if let jobId, !jobId.isEmpty {
            path += "&job_id=\(jobId)"
        }
        let r: RiskDecisionsResponse = try await APIClient.shared.request(path: path)
        return r.data ?? []
    }

    /// GET /api/v1/projects/:id/workers
    static func projectWorkers(projectId: String, limit: Int = 100) async throws -> [ProjectWorkerDTO] {
        let r: ProjectWorkersResponse = try await APIClient.shared.request(
            path: "projects/\(projectId)/workers?limit=\(limit)"
        )
        return r.data ?? []
    }

    /// GET /api/v1/tenant/members
    static func tenantMembers() async throws -> [TenantMemberDTO] {
        let r: TenantMembersResponse = try await APIClient.shared.request(path: "tenant/members")
        return r.data ?? []
    }

    /// GET /api/v1/tenant/invitations
    static func tenantInvitations() async throws -> [TenantInvitationDTO] {
        let r: TenantInvitationsResponse = try await APIClient.shared.request(path: "tenant/invitations")
        return r.data ?? []
    }

    /// GET /api/v1/notifications/unread-count
    static func unreadNotificationCount() async throws -> Int {
        struct Response: Decodable { let count: Int? }
        let r: Response = try await APIClient.shared.request(path: "notifications/unread-count")
        return r.count ?? 0
    }

    /// GET /api/v1/reports/:id/analysis-status
    static func reportAnalysisStatus(reportId: String) async throws -> ReportAnalysisStatusDTO {
        try await APIClient.shared.request(path: "reports/\(reportId)/analysis-status")
    }

    /// GET /api/v1/reports/:id/approval-history
    static func reportApprovalHistory(reportId: String) async throws -> [ReportApprovalEventDTO] {
        struct Response: Decodable {
            let data: Payload?
            struct Payload: Decodable {
                let events: [ReportApprovalEventDTO]?
            }
        }
        let r: Response = try await APIClient.shared.request(path: "reports/\(reportId)/approval-history")
        return r.data?.events ?? []
    }

    /// POST /api/v1/devices/unregister — same contract as Worker before sign-out.
    static func unregisterDevice() async throws {
        struct Body: Encodable {
            let deviceId: String
            enum CodingKeys: String, CodingKey { case deviceId = "device_id" }
        }
        try await APIClient.shared.requestVoid(
            path: "devices/unregister",
            method: "POST",
            body: Body(deviceId: DeviceContext.deviceId),
            idempotencyKey: DeviceContext.idempotencyKeyDeviceUnregister()
        )
    }

    /// GET /api/v1/projects/:id/estimate — manager commercial estimate/budget summary (not customer portal).
    static func projectEstimate(projectId: String) async throws -> ProjectEstimateSummaryDTO? {
        let r: ProjectEstimateResponse = try await APIClient.shared.request(path: "projects/\(projectId)/estimate")
        return r.data
    }

    /// GET /api/v1/ai/requests — list AI jobs (tenant-scoped).
    static func aiRequests(limit: Int? = nil, offset: Int? = nil, status: String? = nil) async throws -> [AIJobDTO] {
        var components = [String]()
        if let l = limit { components.append("limit=\(l)") }
        if let o = offset { components.append("offset=\(o)") }
        if let s = status, !s.isEmpty { components.append("status=\(s.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? s)") }
        let query = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        let r: AIRequestsResponse = try await APIClient.shared.request(path: "ai/requests\(query)")
        return r.data ?? []
    }

    /// GET /api/v1/projects/:id/timeline — project activity feed.
    static func projectTimeline(projectId: String, limit: Int = 20) async throws -> [ProjectTimelineItemDTO] {
        let r: ProjectTimelineResponse = try await APIClient.shared.request(
            path: "projects/\(projectId)/timeline?limit=\(limit)"
        )
        return r.data ?? []
    }

    /// GET /api/v1/projects/:id — project detail.
    static func projectDetail(id: String) async throws -> ProjectDetailDTO {
        let r: ProjectDetailResponse = try await APIClient.shared.request(path: "projects/\(id)")
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// GET /api/v1/projects/:id/summary — project summary counts.
    static func issues(projectId: String) async throws -> [ManagerIssueDTO] {
        let r: ManagerIssuesResponse = try await APIClient.shared.request(path: "projects/\(projectId)/issues")
        return r.data ?? []
    }

    static func patchIssueStatus(projectId: String, issueId: String, status: String) async throws -> ManagerIssueDTO {
        struct Body: Encodable { let status: String }
        struct Envelope: Decodable { let data: ManagerIssueDTO? }
        let r: Envelope = try await APIClient.shared.request(
            path: "projects/\(projectId)/issues/\(issueId)",
            method: "PATCH",
            body: Body(status: status)
        )
        guard let data = r.data else {
            throw APIError(statusCode: nil, code: nil, message: "No issue data")
        }
        return data
    }

    static func projectSummary(projectId: String) async throws -> ProjectSummaryDTO {
        // Backend returns camelCase counts; default client decoder uses convertFromSnakeCase.
        let r: ProjectSummaryResponse = try await APIClient.shared.request(
            path: "projects/\(projectId)/summary",
            keyDecoding: .useDefaultKeys
        )
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// GET /api/v1/projects/:id/ai — AI analysis jobs for project (media-scoped).
    static func projectAi(projectId: String, limit: Int? = nil, offset: Int? = nil) async throws -> [ProjectAIRowDTO] {
        var path = "projects/\(projectId)/ai"
        var components = [String]()
        if let l = limit { components.append("limit=\(l)") }
        if let o = offset { components.append("offset=\(o)") }
        if !components.isEmpty { path += "?" + components.joined(separator: "&") }
        let r: ProjectAIResponse = try await APIClient.shared.request(path: path)
        return r.data ?? []
    }

    /// POST /api/v1/devices/register — register APNS token for push. Token never logged.
    static func registerDevice(pushToken: String) async throws {
        struct Body: Encodable {
            let deviceId: String
            let platform: String
            let token: String
            enum CodingKeys: String, CodingKey {
                case deviceId = "device_id"
                case platform
                case token
            }
        }
        let body = Body(deviceId: DeviceContext.deviceId, platform: "ios", token: pushToken)
        let _: RegisterDeviceResponse = try await APIClient.shared.request(
            path: "devices/register",
            method: "POST",
            body: body,
            idempotencyKey: DeviceContext.idempotencyKeyDeviceRegister(pushToken: pushToken)
        )
    }

    /// POST /api/v1/tasks/:id/assign — assign task to worker.
    static func assignTask(taskId: String, workerId: String, idempotencyKey: String) async throws {
        struct Body: Encodable {
            let workerId: String
            enum CodingKeys: String, CodingKey { case workerId = "worker_id" }
        }
        let _: AssignTaskResponse = try await APIClient.shared.request(path: "tasks/\(taskId)/assign", method: "POST", body: Body(workerId: workerId), idempotencyKey: idempotencyKey)
    }

    /// GET /api/v1/devices — list devices for tenant (no push tokens). May require admin in some deployments.
    static func devices(limit: Int? = nil, offset: Int? = nil) async throws -> [DeviceRowDTO] {
        var components = [String]()
        if let l = limit { components.append("limit=\(l)") }
        if let o = offset { components.append("offset=\(o)") }
        let query = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        let r: DevicesListResponse = try await APIClient.shared.request(path: "devices\(query)")
        return r.data ?? []
    }

    /// GET /api/v1/notifications — manager inbox (tenant-scoped). Paginated.
    static func notifications(limit: Int? = nil, offset: Int? = nil) async throws -> (items: [NotificationInboxItemDTO], total: Int) {
        var components = [String]()
        if let l = limit { components.append("limit=\(l)") }
        if let o = offset { components.append("offset=\(o)") }
        let query = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        let r: NotificationsListResponse = try await APIClient.shared.request(path: "notifications\(query)")
        return (r.data ?? [], r.total ?? 0)
    }

    /// PATCH /api/v1/notifications/:id/read — mark as read.
    static func markNotificationRead(id: String) async throws {
        let _: MarkReadResponse = try await APIClient.shared.request(path: "notifications/\(id)/read", method: "PATCH")
    }

    /// PATCH /api/v1/notifications/read-all — same as cabinet mark-all-read.
    static func markAllNotificationsRead() async throws {
        struct Response: Decodable { var marked: Int? }
        let _: Response = try await APIClient.shared.request(path: "notifications/read-all", method: "PATCH")
    }

    /// POST /api/v1/projects/:id/documents/:documentId/decision
    static func decideDocument(
        projectId: String,
        documentId: String,
        action: String,
        comment: String? = nil,
        idempotencyKey: String
    ) async throws {
        struct Body: Encodable {
            let action: String
            let comment: String?
        }
        struct Response: Decodable { var data: ProjectDocumentDTO? }
        let _: Response = try await APIClient.shared.request(
            path: "projects/\(projectId)/documents/\(documentId)/decision",
            method: "POST",
            body: Body(action: action, comment: comment),
            idempotencyKey: idempotencyKey
        )
    }

    /// GET /api/v1/workload?audience=manager — operational inbox (existing manager read model).
    static func workload(audience: String = "manager") async throws -> WorkloadInboxDTO {
        let encoded = audience.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? audience
        let r: WorkloadResponse = try await APIClient.shared.request(path: "workload?audience=\(encoded)")
        return r.data ?? WorkloadInboxDTO(items: [], counts: nil)
    }

    /// GET /api/v1/activation/status — onboarding/checklist progress.
    static func activationStatus() async throws -> ActivationStatusDTO {
        try await APIClient.shared.request(path: "activation/status")
    }

    /// POST /api/v1/help/hints — role/locale-aware hints for next steps.
    static func helpHints(locale: String, role: String, getStarted: GetStartedStatusDTO?) async throws -> [HelpHintDTO] {
        struct Body: Encodable {
            let locale: String
            let role: String
            let getStarted: GetStartedStatusDTO?
        }
        let r: HelpHintsResponseDTO = try await APIClient.shared.request(
            path: "help/hints",
            method: "POST",
            body: Body(locale: locale, role: role, getStarted: getStarted)
        )
        return r.hints ?? []
    }

    /// POST /api/v1/help/assistant — luxury guide with context, confidence and risks.
    static func helpAssistant(
        query: String,
        locale: String,
        role: String,
        pathname: String,
        activation: ActivationStatusDTO?
    ) async throws -> HelpAssistantResponseDTO {
        struct Body: Encodable {
            let query: String
            let locale: String
            let role: String
            let pathname: String
            let getStarted: GetStartedStatusDTO?
            let projectCount: Int?
            let taskCount: Int?
            let reportCount: Int?
            let hasAiInsight: Bool?
        }
        let body = Body(
            query: query,
            locale: locale,
            role: role,
            pathname: pathname,
            getStarted: activation?.getStarted,
            projectCount: activation?.projectCount,
            taskCount: activation?.taskCount,
            reportCount: activation?.reportCount,
            hasAiInsight: activation?.hasAiInsight
        )
        return try await APIClient.shared.request(path: "help/assistant", method: "POST", body: body)
    }

    static func helpAssistantEvent(type: String, locale: String, role: String, pathname: String) async {
        struct Body: Encodable {
            let type: String
            let locale: String
            let role: String
            let pathname: String
        }
        _ = try? await APIClient.shared.request(
            path: "help/assistant/events",
            method: "POST",
            body: Body(type: type, locale: locale, role: role, pathname: pathname)
        ) as HelpAssistantEventAckDTO
    }
}

// MARK: - Manager-specific DTOs (backend contract)

struct ReportListItemDTO: Codable {
    let id: String
    let projectId: String?
    let taskId: String?
    let userId: String?
    let status: String?
    let createdAt: String?
    let submittedAt: String?
    let mediaCount: Int?
    let analysisStatus: String?
    let actualVolume: Double?
    let plannedVolume: Double?
}

struct ReportsListResponse: Decodable {
    let data: [ReportListItemDTO]?
}

/// GET /api/v1/tasks returns { data, total }.
struct TasksListResponse: Decodable {
    let data: [TaskDTO]?
    let total: Int?
}

/// GET /api/v1/me returns { data: { tenant_id, user_id, role } }.
struct MeResponse: Decodable {
    let data: MeData?
    struct MeData: Decodable {
        let tenantId: String?
        let userId: String?
        let role: String?
        let tenantName: String?
    }
}

/// GET /api/v1/ops/overview — kpis + queues.
struct OpsOverviewDTO: Decodable {
    let kpis: OpsOverviewKpis?
    let queues: OpsOverviewQueues?
    struct OpsOverviewKpis: Decodable {
        let activeProjects: Int?
        let activeWorkersToday: Int?
        let reportsToday: Int?
        let stuckUploads: Int?
        let offlineDevices: Int?
        let failedJobs24h: Int?
        let tasksAssignedToday: Int?
        let tasksCompletedToday: Int?
        let tasksOpenToday: Int?
        let tasksOverdue: Int?
    }
    struct OpsOverviewQueues: Decodable {
        let reportsPendingReview: [QueueItem]?
        let tasksOverdue: [TaskQueueItem]?
        let tasksOpenToday: [TaskQueueItem]?
    }
}
struct QueueItem: Decodable { let id: String?; let status: String?; let createdAt: String? }
struct TaskQueueItem: Decodable { let id: String?; let title: String?; let dueDate: String? }

/// GET /api/v1/workers — worker row.
/// Keys stay camelCase so `APIClient`'s default `.convertFromSnakeCase` can map `user_id`.
struct WorkerRowDTO: Codable {
    let userId: String
    let lastDayDate: String?
    let lastStartedAt: String?
    let lastEndedAt: String?
    let lastReportSubmittedAt: String?
    let anomalies: WorkerAnomalies?

    init(
        userId: String,
        lastDayDate: String? = nil,
        lastStartedAt: String? = nil,
        lastEndedAt: String? = nil,
        lastReportSubmittedAt: String? = nil,
        anomalies: WorkerAnomalies? = nil
    ) {
        self.userId = userId
        self.lastDayDate = lastDayDate
        self.lastStartedAt = lastStartedAt
        self.lastEndedAt = lastEndedAt
        self.lastReportSubmittedAt = lastReportSubmittedAt
        self.anomalies = anomalies
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let rawId = try c.decodeIfPresent(String.self, forKey: .userId)
        userId = rawId ?? ""
        lastDayDate = try c.decodeIfPresent(String.self, forKey: .lastDayDate)
        lastStartedAt = try c.decodeIfPresent(String.self, forKey: .lastStartedAt)
        lastEndedAt = try c.decodeIfPresent(String.self, forKey: .lastEndedAt)
        lastReportSubmittedAt = try c.decodeIfPresent(String.self, forKey: .lastReportSubmittedAt)
        anomalies = try c.decodeIfPresent(WorkerAnomalies.self, forKey: .anomalies)
    }
}
struct WorkerAnomalies: Codable {
    let openShift: Bool?
    let overtime: Bool?
    let noActivity: Bool?
}
struct WorkersListResponse: Decodable { let data: [WorkerRowDTO]? }

/// GET /api/v1/reports/:id — report detail (spread report + media). PATCH returns same shape with reviewed_*.
struct ReportDetailDTO: Decodable {
    let id: String?
    let tenantId: String?
    let userId: String?
    let taskId: String?
    let status: String?
    let createdAt: String?
    let submittedAt: String?
    let reviewedAt: String?
    let reviewedBy: String?
    let managerNote: String?
    let workerNote: String?
    let actualVolume: Double?
    let plannedVolume: Double?
    let media: [ReportMediaItem]?
}

struct ManagerAnalysisStatusDTO: Decodable {
    let status: String
    let reportId: String?
    let jobCount: Int?
    let summary: ManagerAnalysisSummaryDTO?
}

struct ManagerAnalysisSummaryDTO: Decodable {
    let mediaTotal: Int?
    let analyzed: Int?
    let failed: Int?
}
struct ReportMediaItem: Decodable {
    let mediaId: String?
    let uploadSessionId: String?
    let fileUrl: String?
}
struct ReportDetailResponse: Decodable { let data: ReportDetailDTO? }

/// GET /api/v1/tasks/:id — task detail.
struct TaskDetailDTO: Decodable {
    let id: String?
    let title: String?
    let status: String?
    let projectId: String?
    let dueDate: String?
    let assignedTo: String?
    let reportId: String?
    let reportStatus: String?
    let description: String?
    let reportRequired: Bool?
    let priority: String?
}

struct RiskDecisionDTO: Decodable, Identifiable {
    let id: String
    let jobId: String?
    let decision: String?
    let comment: String?
    let title: String?
    let actor: String?
    let createdAt: String?
}

struct RiskDecisionsResponse: Decodable { let data: [RiskDecisionDTO]? }
struct TaskDetailResponse: Decodable { let data: TaskDetailDTO? }

struct ProjectTimelineItemDTO: Decodable, Identifiable {
    let id: String
    let eventType: String?
    let occurredAt: String?
    let actorLabel: String?
    let title: String?
    let description: String?
    let entityType: String?
    let entityId: String?
}

struct ProjectTimelineResponse: Decodable {
    let data: [ProjectTimelineItemDTO]?
}

/// GET /api/v1/projects/:id — project detail.
struct ProjectDetailDTO: Decodable {
    let id: String
    let name: String?
    let tenantId: String?
    let createdAt: String?
}
struct ProjectDetailResponse: Decodable { let data: ProjectDetailDTO? }

/// GET /api/v1/projects/:id/summary — summary counts (backend returns camelCase).
struct ProjectSummaryDTO: Decodable {
    let activeWorkers: Int?
    let openReports: Int?
    let aiAnalyses: Int?
    let openIssuesCount: Int?
}

struct ManagerIssueDTO: Decodable, Identifiable {
    let id: String
    let title: String?
    let description: String?
    let status: String?
    let createdAt: String?
    let evidenceUrl: String?
    let evidenceUploadSessionId: String?
    enum CodingKeys: String, CodingKey {
        case id, title, description, status
        case createdAt = "created_at"
        case evidenceUrl = "evidence_url"
        case evidenceUploadSessionId = "evidence_upload_session_id"
    }
}

struct ManagerIssuesResponse: Decodable { let data: [ManagerIssueDTO]? }
struct ProjectSummaryResponse: Decodable { let data: ProjectSummaryDTO? }

/// GET /api/v1/projects/:id/ai — project AI row (analysis_jobs).
struct ProjectAIRowDTO: Decodable {
    let id: String?
    let mediaId: String?
    let status: String?
    let createdAt: String?
}
struct ProjectAIResponse: Decodable { let data: [ProjectAIRowDTO]? }

/// POST /api/v1/tasks/:id/assign — response { ok: true }.
struct AssignTaskResponse: Decodable { let ok: Bool? }

/// GET /api/v1/devices — device row (no tokens).
struct DeviceRowDTO: Decodable {
    let userId: String?
    let deviceId: String?
    let platform: String?
    let createdAt: String?
    let disabledAt: String?
}
struct DevicesListResponse: Decodable { let data: [DeviceRowDTO]?; let total: Int? }

/// GET /api/v1/notifications — inbox item.
struct NotificationInboxItemDTO: Codable {
    let id: String
    let type: String?
    let title: String?
    let body: String?
    let createdAt: String?
    let readAt: String?
    let targetType: String?
    let targetId: String?
    let projectId: String?
}
struct NotificationsListResponse: Decodable { let data: [NotificationInboxItemDTO]?; let total: Int? }

struct WorkloadItemDTO: Decodable, Identifiable {
    let id: String
    let kind: String?
    let priority: String?
    let title: String?
    let reason: String?
    let projectId: String?
    let projectName: String?
    let linkedEntityType: String?
    let linkedEntityId: String?
    let dueState: String?
    let statusBucket: String?
}

struct WorkloadCountsDTO: Decodable {
    let urgent: Int?
    let high: Int?
    let normal: Int?
}

struct WorkloadInboxDTO: Decodable {
    let items: [WorkloadItemDTO]?
    let counts: WorkloadCountsDTO?
}

struct WorkloadResponse: Decodable {
    let data: WorkloadInboxDTO?
}
struct MarkReadResponse: Decodable { let ok: Bool? }

/// GET /api/v1/ai/requests — AI job row.
struct AIJobDTO: Decodable {
    let id: String?
    let type: String?
    let status: String?
    let entity: String?
    let attempts: Int?
    let lastError: String?
    let createdAt: String?
    let updatedAt: String?
}
struct AIRequestsResponse: Decodable { let data: [AIJobDTO]? }

struct ProjectWorkerDTO: Decodable {
    let userId: String
    let role: String?
    let status: String?
}

struct ProjectWorkersResponse: Decodable {
    let data: [ProjectWorkerDTO]?
}

struct TenantMemberDTO: Decodable, Identifiable {
    let userId: String
    let role: String?
    let createdAt: String?
    let isOwner: Bool?
    let email: String?
    var id: String { userId }
}

struct TenantMembersResponse: Decodable {
    let data: [TenantMemberDTO]?
}

struct TenantInvitationDTO: Decodable, Identifiable {
    let id: String
    let email: String?
    let role: String?
    let expiresAt: String?
    let createdAt: String?
}

struct TenantInvitationsResponse: Decodable {
    let data: [TenantInvitationDTO]?
}

struct ReportAnalysisStatusDTO: Decodable {
    let status: String?
    let reportId: String?
    let jobCount: Int?
}

struct ReportApprovalEventDTO: Decodable, Hashable {
    let action: String?
    let createdAt: String?
    let userId: String?
}

// MARK: - Help/Activation DTOs

struct ActivationStatusDTO: Decodable {
    let projectCount: Int?
    let hasInvited: Bool?
    let taskCount: Int?
    let reportCount: Int?
    let hasAiInsight: Bool?
    let showOnboarding: Bool?
    let getStarted: GetStartedStatusDTO?
}

struct GetStartedStatusDTO: Codable {
    let createProject: Bool?
    let inviteTeam: Bool?
    let addTask: Bool?
    let uploadReport: Bool?
    let viewAi: Bool?
}

struct HelpHintDTO: Decodable {
    let step: String
    let title: String
    let reason: String
    let action: String
    let href: String
}

struct HelpHintsResponseDTO: Decodable {
    let hints: [HelpHintDTO]?
}

struct HelpAssistantRiskSignalDTO: Decodable {
    let id: String
    let title: String
    let detail: String
    let severity: String
    let href: String
}

struct HelpAssistantResponseDTO: Decodable {
    let summary: String
    let answer: String
    let riskSignals: [HelpAssistantRiskSignalDTO]?
    let confidence: Int?
}

struct HelpAssistantEventAckDTO: Decodable {
    let ok: Bool?
}

struct WorkerSummaryDTO: Decodable {
    let reportsCount: Int?
    let mediaCount: Int?
    let isContractor: Bool?
    let tasksAssigned: Int?
    let tasksOverdue: Int?
    let reportsPendingReview: Int?
}

struct WorkerSummaryResponse: Decodable {
    let data: WorkerSummaryDTO?
}
