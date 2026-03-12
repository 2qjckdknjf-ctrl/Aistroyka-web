//
//  Endpoints.swift
//  Shared
//

import Foundation

// Response DTOs (snake_case from API)
public struct ConfigResponse: Decodable {
    public let serverTime: String?
    public let clientProfile: String?
}

public struct ProjectDTO: Decodable {
    public let id: String
    public let name: String?
}

public struct ProjectsResponse: Decodable {
    public let data: [ProjectDTO]?
}

public struct TaskDTO: Decodable {
    public let id: String
    public let title: String
    public let status: String
    public let projectId: String?
    public let dueDate: String?
    public let createdAt: String?
    public let assignedTo: String?
}

public struct TasksTodayResponse: Decodable {
    public let data: [TaskDTO]?
}

public struct RegisterDeviceResponse: Decodable {
    public let success: Bool?
}

public struct ReportCreateResponse: Decodable {
    public let data: ReportCreateData?
    public struct ReportCreateData: Decodable {
        public let id: String
    }
}

public struct UploadSessionResponse: Decodable {
    public let data: UploadSessionData?
    public struct UploadSessionData: Decodable {
        public let id: String
        public let uploadPath: String?
        enum CodingKeys: String, CodingKey {
            case id
            case uploadPath = "upload_path"
        }
    }
}

public struct SyncConflictBody: Decodable {
    public let code: String?
    public let mustBootstrap: Bool?
    public let serverCursor: Int?
    enum CodingKeys: String, CodingKey {
        case code
        case mustBootstrap = "must_bootstrap"
        case serverCursor = "server_cursor"
    }
}

public struct SyncConflictError: Error {
    public let body: SyncConflictBody
    public init(body: SyncConflictBody) { self.body = body }
    public var mustBootstrap: Bool { body.mustBootstrap == true }
    public var serverCursor: Int { body.serverCursor ?? 0 }
}

public struct SyncBootstrapResponse: Decodable {
    public let data: SyncBootstrapData?
    public let cursor: Int?
    public struct SyncBootstrapData: Decodable {
        public let tasks: [SyncTask]?
        public let reports: [SyncReport]?
        public let uploadSessions: [SyncUploadSession]?
        enum CodingKeys: String, CodingKey {
            case tasks
            case reports
            case uploadSessions = "uploadSessions"
        }
    }
    public struct SyncTask: Decodable { public let id: String? }
    public struct SyncReport: Decodable { public let id: String? }
    public struct SyncUploadSession: Decodable { public let id: String? }
}

public struct SyncChangesResponse: Decodable {
    public let data: SyncChangesData?
    public let nextCursor: Int?
    enum CodingKeys: String, CodingKey {
        case data
        case nextCursor = "next_cursor"
    }
    public struct SyncChangesData: Decodable {
        public let changes: [SyncChangeItem]?
    }
}

public struct SyncChangeItem: Decodable {
    public let cursor: Int?
    public let resourceType: String?
    public let resourceId: String?
    public let changeType: String?
    enum CodingKeys: String, CodingKey {
        case cursor
        case resourceType = "resource_type"
        case resourceId = "resource_id"
        case changeType = "change_type"
    }
}
