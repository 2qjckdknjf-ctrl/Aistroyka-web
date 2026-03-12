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

    /// GET /api/v1/projects — list projects (tenant-scoped).
    static func projects() async throws -> [ProjectDTO] {
        let r: ProjectsResponse = try await APIClient.shared.request(path: "projects")
        return r.data ?? []
    }

    /// GET /api/v1/tasks — list tasks. Query: project_id, from, to, status, q, limit, offset.
    static func tasks(projectId: String? = nil, status: String? = nil, limit: Int? = nil, offset: Int? = nil) async throws -> [TaskDTO] {
        var components = [String]()
        if let id = projectId, !id.isEmpty { components.append("project_id=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)") }
        if let s = status, !s.isEmpty { components.append("status=\(s.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? s)") }
        if let l = limit { components.append("limit=\(l)") }
        if let o = offset { components.append("offset=\(o)") }
        let query = components.isEmpty ? "" : "?" + components.joined(separator: "&")
        let r: TasksListResponse = try await APIClient.shared.request(path: "tasks\(query)")
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

    /// GET /api/v1/workers — list workers with last activity (tenant-scoped).
    static func workers(limit: Int? = nil) async throws -> [WorkerRowDTO] {
        var path = "workers"
        if let l = limit { path += "?limit=\(l)" }
        let r: WorkersListResponse = try await APIClient.shared.request(path: path)
        return r.data ?? []
    }

    /// GET /api/v1/reports/:id — report detail with media.
    static func reportDetail(id: String) async throws -> ReportDetailDTO {
        let r: ReportDetailResponse = try await APIClient.shared.request(path: "reports/\(id)")
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// PATCH /api/v1/reports/:id — manager review (approved / reviewed / changes_requested). Optional manager_note.
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
        struct Body: Encodable {
            let projectId: String
            let title: String
            enum CodingKeys: String, CodingKey { case projectId = "project_id"; case title }
        }
        let r: TaskDetailResponse = try await APIClient.shared.request(path: "tasks", method: "POST", body: Body(projectId: projectId, title: title), idempotencyKey: idempotencyKey)
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
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

    /// GET /api/v1/projects/:id — project detail.
    static func projectDetail(id: String) async throws -> ProjectDetailDTO {
        let r: ProjectDetailResponse = try await APIClient.shared.request(path: "projects/\(id)")
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No data") }
        return data
    }

    /// GET /api/v1/projects/:id/summary — project summary counts.
    static func projectSummary(projectId: String) async throws -> ProjectSummaryDTO {
        let r: ProjectSummaryResponse = try await APIClient.shared.request(path: "projects/\(projectId)/summary")
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
}

// MARK: - Manager-specific DTOs (backend contract)

struct ReportListItemDTO: Decodable {
    let id: String
    let projectId: String?
    let status: String?
    let createdAt: String?
    let mediaCount: Int?
    let analysisStatus: String?
    enum CodingKeys: String, CodingKey {
        case id
        case projectId = "project_id"
        case status
        case createdAt = "created_at"
        case mediaCount = "media_count"
        case analysisStatus = "analysis_status"
    }
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
        enum CodingKeys: String, CodingKey {
            case tenantId = "tenant_id"
            case userId = "user_id"
            case role
        }
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
        enum CodingKeys: String, CodingKey {
            case activeProjects
            case activeWorkersToday
            case reportsToday
            case stuckUploads
            case offlineDevices
            case failedJobs24h
            case tasksAssignedToday = "tasks_assigned_today"
            case tasksCompletedToday = "tasks_completed_today"
            case tasksOpenToday = "tasks_open_today"
            case tasksOverdue = "tasks_overdue"
        }
    }
    struct OpsOverviewQueues: Decodable {
        let reportsPendingReview: [QueueItem]?
        let tasksOverdue: [TaskQueueItem]?
        let tasksOpenToday: [TaskQueueItem]?
    }
}
struct QueueItem: Decodable { let id: String?; let status: String?; let createdAt: String?; enum CodingKeys: String, CodingKey { case id; case status; case createdAt = "created_at" } }
struct TaskQueueItem: Decodable { let id: String?; let title: String?; let dueDate: String?; enum CodingKeys: String, CodingKey { case id; case title; case dueDate = "due_date" } }

/// GET /api/v1/workers — worker row.
struct WorkerRowDTO: Decodable {
    let userId: String
    let lastDayDate: String?
    let lastStartedAt: String?
    let lastEndedAt: String?
    let lastReportSubmittedAt: String?
    let anomalies: WorkerAnomalies?
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case lastDayDate = "last_day_date"
        case lastStartedAt = "last_started_at"
        case lastEndedAt = "last_ended_at"
        case lastReportSubmittedAt = "last_report_submitted_at"
        case anomalies
    }
}
struct WorkerAnomalies: Decodable {
    let openShift: Bool?
    let overtime: Bool?
    let noActivity: Bool?
    enum CodingKeys: String, CodingKey { case openShift = "open_shift"; case overtime; case noActivity = "no_activity" }
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
    let media: [ReportMediaItem]?
    enum CodingKeys: String, CodingKey {
        case id; case tenantId = "tenant_id"; case userId = "user_id"; case taskId = "task_id"
        case status; case createdAt = "created_at"; case submittedAt = "submitted_at"
        case reviewedAt = "reviewed_at"; case reviewedBy = "reviewed_by"; case managerNote = "manager_note"
        case media
    }
}
struct ReportMediaItem: Decodable {
    let mediaId: String?
    let uploadSessionId: String?
    enum CodingKeys: String, CodingKey { case mediaId = "media_id"; case uploadSessionId = "upload_session_id" }
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
    enum CodingKeys: String, CodingKey {
        case id; case title; case status; case projectId = "project_id"; case dueDate = "due_date"
        case assignedTo = "assigned_to"; case reportId = "report_id"; case reportStatus = "report_status"
    }
}
struct TaskDetailResponse: Decodable { let data: TaskDetailDTO? }

/// GET /api/v1/projects/:id — project detail.
struct ProjectDetailDTO: Decodable {
    let id: String
    let name: String?
    let tenantId: String?
    let createdAt: String?
    enum CodingKeys: String, CodingKey { case id; case name; case tenantId = "tenant_id"; case createdAt = "created_at" }
}
struct ProjectDetailResponse: Decodable { let data: ProjectDetailDTO? }

/// GET /api/v1/projects/:id/summary — summary counts (backend returns camelCase).
struct ProjectSummaryDTO: Decodable {
    let activeWorkers: Int?
    let openReports: Int?
    let aiAnalyses: Int?
}
struct ProjectSummaryResponse: Decodable { let data: ProjectSummaryDTO? }

/// GET /api/v1/projects/:id/ai — project AI row (analysis_jobs).
struct ProjectAIRowDTO: Decodable {
    let id: String?
    let mediaId: String?
    let status: String?
    let createdAt: String?
    enum CodingKeys: String, CodingKey { case id; case mediaId = "media_id"; case status; case createdAt = "created_at" }
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
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"; case deviceId = "device_id"; case platform
        case createdAt = "created_at"; case disabledAt = "disabled_at"
    }
}
struct DevicesListResponse: Decodable { let data: [DeviceRowDTO]?; let total: Int? }

/// GET /api/v1/notifications — inbox item.
struct NotificationInboxItemDTO: Decodable {
    let id: String
    let type: String?
    let title: String?
    let body: String?
    let createdAt: String?
    let readAt: String?
    let targetType: String?
    let targetId: String?
    enum CodingKeys: String, CodingKey {
        case id; case type; case title; case body
        case createdAt = "created_at"; case readAt = "read_at"
        case targetType = "target_type"; case targetId = "target_id"
    }
}
struct NotificationsListResponse: Decodable { let data: [NotificationInboxItemDTO]?; let total: Int? }
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
    enum CodingKeys: String, CodingKey {
        case id; case type; case status; case entity
        case attempts; case lastError = "last_error"; case createdAt = "created_at"; case updatedAt = "updated_at"
    }
}
struct AIRequestsResponse: Decodable { let data: [AIJobDTO]? }
