//
//  ManagerAPI.swift
//  AiStroyka Manager
//
//  Manager-facing API: projects, tasks, reports, workers, ops. Uses shared APIClient and DTOs.
//

import Foundation

enum ManagerAPI {

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
