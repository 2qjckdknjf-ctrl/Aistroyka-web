//
//  Endpoints.swift
//  AiStroykaWorker
//

import Foundation

// Response DTOs (snake_case from API)
struct ConfigResponse: Decodable {
    let serverTime: String?
    let clientProfile: String?
}

struct ProjectDTO: Decodable {
    let id: String
    let name: String?
}

struct ProjectsResponse: Decodable {
    let data: [ProjectDTO]?
}

/// Decodes from API snake_case (keyDecodingStrategy .convertFromSnakeCase).
struct TaskDTO: Decodable {
    let id: String
    let title: String
    let status: String
    let projectId: String?
    let dueDate: String?
    let createdAt: String?
    let assignedTo: String?
}

struct TasksTodayResponse: Decodable {
    let data: [TaskDTO]?
}

struct RegisterDeviceResponse: Decodable {
    let success: Bool?
}

struct ReportCreateResponse: Decodable {
    let data: ReportCreateData?
    struct ReportCreateData: Decodable {
        let id: String
    }
}

struct UploadSessionResponse: Decodable {
    let data: UploadSessionData?
    struct UploadSessionData: Decodable {
        let id: String
        let uploadPath: String?
        enum CodingKeys: String, CodingKey {
            case id
            case uploadPath = "upload_path"
        }
    }
}

struct SyncConflictBody: Decodable {
    let code: String?
    let mustBootstrap: Bool?
    let serverCursor: Int?
    enum CodingKeys: String, CodingKey {
        case code
        case mustBootstrap = "must_bootstrap"
        case serverCursor = "server_cursor"
    }
}

/// Thrown when sync/changes or sync/ack returns 409. Use mustBootstrap to run bootstrap and retry.
struct SyncConflictError: Error {
    let body: SyncConflictBody
    var mustBootstrap: Bool { body.mustBootstrap == true }
    var serverCursor: Int { body.serverCursor ?? 0 }
}

struct SyncBootstrapResponse: Decodable {
    let data: SyncBootstrapData?
    let cursor: Int?
    struct SyncBootstrapData: Decodable {
        let tasks: [SyncTask]?
        let reports: [SyncReport]?
        let uploadSessions: [SyncUploadSession]?
        enum CodingKeys: String, CodingKey {
            case tasks
            case reports
            case uploadSessions = "uploadSessions"
        }
    }
    struct SyncTask: Decodable { let id: String? }
    struct SyncReport: Decodable { let id: String? }
    struct SyncUploadSession: Decodable { let id: String? }
}

struct SyncChangesResponse: Decodable {
    let data: SyncChangesData?
    let nextCursor: Int?
    enum CodingKeys: String, CodingKey {
        case data
        case nextCursor = "next_cursor"
    }
    struct SyncChangesData: Decodable {
        let changes: [SyncChangeItem]?
    }
}
struct SyncChangeItem: Decodable {
    let cursor: Int?
    let resourceType: String?
    let resourceId: String?
    let changeType: String?
    enum CodingKeys: String, CodingKey {
        case cursor
        case resourceType = "resource_type"
        case resourceId = "resource_id"
        case changeType = "change_type"
    }
}
