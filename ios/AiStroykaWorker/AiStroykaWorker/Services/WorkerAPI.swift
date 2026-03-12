//
//  WorkerAPI.swift
//  AiStroykaWorker
//

import Foundation
import Shared

/// High-level API for AiStroyka Worker endpoints. All writes use idempotency keys.
enum WorkerAPI {
    
    static func config() async throws -> ConfigResponse {
        try await APIClient.shared.request(path: "config")
    }
    
    static func projects() async throws -> [ProjectDTO] {
        let r: ProjectsResponse = try await APIClient.shared.request(path: "projects")
        return r.data ?? []
    }

    /// POST /api/v1/devices/register — register APNS token for push. Token must never be logged or shown in UI.
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
            idempotencyKey: nil
        )
    }

    /// GET /api/v1/worker/tasks/today?project_id= (optional)
    static func tasksToday(projectId: String?) async throws -> [TaskDTO] {
        var path = "worker/tasks/today"
        if let id = projectId, !id.isEmpty {
            path += "?project_id=\(id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id)"
        }
        let r: TasksTodayResponse = try await APIClient.shared.request(path: path)
        return r.data ?? []
    }
    
    static func startDay(idempotencyKey: String) async throws {
        try await APIClient.shared.requestVoid(
            path: "worker/day/start",
            method: "POST",
            body: EmptyBody(),
            idempotencyKey: idempotencyKey
        )
    }
    
    static func endDay(idempotencyKey: String) async throws {
        try await APIClient.shared.requestVoid(
            path: "worker/day/end",
            method: "POST",
            body: EmptyBody(),
            idempotencyKey: idempotencyKey
        )
    }
    
    static func createReport(dayId: String?, taskId: String?, idempotencyKey: String) async throws -> String {
        struct Body: Encodable {
            let dayId: String?
            let taskId: String?
            enum CodingKeys: String, CodingKey { case dayId = "day_id"; case taskId = "task_id" }
        }
        let r: ReportCreateResponse = try await APIClient.shared.request(
            path: "worker/report/create",
            method: "POST",
            body: Body(dayId: dayId, taskId: taskId),
            idempotencyKey: idempotencyKey
        )
        guard let id = r.data?.id else { throw APIError(statusCode: nil, code: nil, message: "No report id in response") }
        return id
    }
    
    static func addMedia(reportId: String, uploadSessionId: String, idempotencyKey: String) async throws {
        struct Body: Encodable {
            let reportId: String
            let uploadSessionId: String
            enum CodingKeys: String, CodingKey {
                case reportId = "report_id"
                case uploadSessionId = "upload_session_id"
            }
        }
        try await APIClient.shared.requestVoid(
            path: "worker/report/add-media",
            method: "POST",
            body: Body(reportId: reportId, uploadSessionId: uploadSessionId),
            idempotencyKey: idempotencyKey
        )
    }
    
    static func submitReport(reportId: String, taskId: String?, idempotencyKey: String) async throws {
        struct Body: Encodable {
            let reportId: String
            let taskId: String?
            enum CodingKeys: String, CodingKey { case reportId = "report_id"; case taskId = "task_id" }
        }
        try await APIClient.shared.requestVoid(
            path: "worker/report/submit",
            method: "POST",
            body: Body(reportId: reportId, taskId: taskId),
            idempotencyKey: idempotencyKey
        )
    }
    
    static func createUploadSession(purpose: String, idempotencyKey: String) async throws -> (id: String, uploadPath: String) {
        struct Body: Encodable {
            let purpose: String
        }
        let r: UploadSessionResponse = try await APIClient.shared.request(
            path: "media/upload-sessions",
            method: "POST",
            body: Body(purpose: purpose),
            idempotencyKey: idempotencyKey
        )
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "No session data") }
        let path = data.uploadPath ?? "media/\(data.id)"
        return (data.id, path)
    }
    
    static func finalizeUploadSession(sessionId: String, objectPath: String, mimeType: String?, sizeBytes: Int?, idempotencyKey: String) async throws {
        struct Body: Encodable {
            let objectPath: String
            let mimeType: String?
            let sizeBytes: Int?
            enum CodingKeys: String, CodingKey {
                case objectPath = "object_path"
                case mimeType = "mime_type"
                case sizeBytes = "size_bytes"
            }
        }
        try await APIClient.shared.requestVoid(
            path: "media/upload-sessions/\(sessionId)/finalize",
            method: "POST",
            body: Body(objectPath: objectPath, mimeType: mimeType, sizeBytes: sizeBytes),
            idempotencyKey: idempotencyKey
        )
    }

    // MARK: - Sync (Phase 7.2)
    static func syncBootstrap() async throws -> SyncBootstrapResponse {
        try await APIClient.shared.request(path: "sync/bootstrap")
    }

    /// On 409 returns SyncConflictError with body (mustBootstrap, serverCursor). Caller should bootstrap and retry when mustBootstrap.
    static func syncChanges(cursor: Int, limit: Int = 100) async throws -> SyncChangesResponse {
        let (data, code) = try await APIClient.shared.requestDataAndResponse(path: "sync/changes?cursor=\(cursor)&limit=\(limit)")
        if code == 409 {
            if let body = try? JSONDecoder().decode(SyncConflictBody.self, from: data) {
                throw SyncConflictError(body: body)
            }
            throw APIError.from(data: data, response: nil)
        }
        if code >= 400 {
            throw APIError.from(data: data, response: nil)
        }
        return try JSONDecoder().decode(SyncChangesResponse.self, from: data)
    }

    static func syncAck(cursor: Int, idempotencyKey: String) async throws {
        struct Body: Encodable {
            let cursor: Int
        }
        try await APIClient.shared.requestVoid(
            path: "sync/ack",
            method: "POST",
            body: Body(cursor: cursor),
            idempotencyKey: idempotencyKey
        )
    }
}

private struct EmptyBody: Encodable {}
