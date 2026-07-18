//
//  TaskMessageDTO.swift
//  Shared
//

import Foundation

public struct TaskMessageDTO: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String?
    public let projectId: String?
    public let taskId: String?
    public let senderUserId: String
    public let kind: String
    public let body: String?
    public let uploadSessionId: String?
    public let durationMs: Int?
    public let clientId: String?
    public let createdAt: String
    public let mimeType: String?
    public let objectPath: String?
    public let sizeBytes: Int?
    public let mediaUrl: String?

    public init(
        id: String,
        tenantId: String? = nil,
        projectId: String? = nil,
        taskId: String? = nil,
        senderUserId: String,
        kind: String,
        body: String? = nil,
        uploadSessionId: String? = nil,
        durationMs: Int? = nil,
        clientId: String? = nil,
        createdAt: String,
        mimeType: String? = nil,
        objectPath: String? = nil,
        sizeBytes: Int? = nil,
        mediaUrl: String? = nil
    ) {
        self.id = id
        self.tenantId = tenantId
        self.projectId = projectId
        self.taskId = taskId
        self.senderUserId = senderUserId
        self.kind = kind
        self.body = body
        self.uploadSessionId = uploadSessionId
        self.durationMs = durationMs
        self.clientId = clientId
        self.createdAt = createdAt
        self.mimeType = mimeType
        self.objectPath = objectPath
        self.sizeBytes = sizeBytes
        self.mediaUrl = mediaUrl
    }
}

public struct TaskMessagesListResponse: Decodable {
    public let data: [TaskMessageDTO]?
    public let nextCursor: String?
}

public struct TaskMessageCreateResponse: Decodable {
    public let data: TaskMessageDTO?
}

/// API helpers for task chat (Worker + Manager).
public enum TaskMessagesAPI {
    public static func list(taskId: String, limit: Int = 80, cursor: String? = nil) async throws -> [TaskMessageDTO] {
        var path = "tasks/\(taskId)/messages?limit=\(limit)"
        if let cursor, !cursor.isEmpty {
            let enc = cursor.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? cursor
            path += "&cursor=\(enc)"
        }
        let r: TaskMessagesListResponse = try await APIClient.shared.request(path: path)
        return r.data ?? []
    }

    /// Load up to `maxPages` pages (oldest→newest concat).
    public static func listAll(taskId: String, pageSize: Int = 80, maxPages: Int = 5) async throws -> [TaskMessageDTO] {
        var all: [TaskMessageDTO] = []
        var cursor: String? = nil
        for _ in 0..<maxPages {
            var path = "tasks/\(taskId)/messages?limit=\(pageSize)"
            if let cursor, !cursor.isEmpty {
                let enc = cursor.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? cursor
                path += "&cursor=\(enc)"
            }
            let r: TaskMessagesListResponse = try await APIClient.shared.request(path: path)
            let page = r.data ?? []
            all.append(contentsOf: page)
            guard let next = r.nextCursor, !next.isEmpty, !page.isEmpty else { break }
            cursor = next
        }
        return all
    }

    public static func delete(taskId: String, messageId: String) async throws {
        struct Ok: Decodable { let ok: Bool? }
        let _: Ok = try await APIClient.shared.request(
            path: "tasks/\(taskId)/messages/\(messageId)",
            method: "DELETE"
        )
    }

    public static func sendText(taskId: String, body: String, clientId: String, idempotencyKey: String) async throws -> TaskMessageDTO {
        struct Body: Encodable {
            let kind: String
            let body: String
            let clientId: String
        }
        let r: TaskMessageCreateResponse = try await APIClient.shared.request(
            path: "tasks/\(taskId)/messages",
            method: "POST",
            body: Body(kind: "text", body: body, clientId: clientId),
            idempotencyKey: idempotencyKey
        )
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "Empty message response") }
        return data
    }

    public static func sendMedia(
        taskId: String,
        kind: String,
        mediaId: String,
        durationMs: Int?,
        clientId: String,
        idempotencyKey: String
    ) async throws -> TaskMessageDTO {
        struct Body: Encodable {
            let kind: String
            let mediaId: String
            let durationMs: Int?
            let clientId: String
        }
        let r: TaskMessageCreateResponse = try await APIClient.shared.request(
            path: "tasks/\(taskId)/messages",
            method: "POST",
            body: Body(kind: kind, mediaId: mediaId, durationMs: durationMs, clientId: clientId),
            idempotencyKey: idempotencyKey
        )
        guard let data = r.data else { throw APIError(statusCode: nil, code: nil, message: "Empty message response") }
        return data
    }

    public static func createUploadSession(idempotencyKey: String) async throws -> (id: String, uploadPath: String) {
        struct Body: Encodable { let purpose: String }
        let r: UploadSessionResponse = try await APIClient.shared.request(
            path: "media/upload-sessions",
            method: "POST",
            body: Body(purpose: "task_chat"),
            idempotencyKey: idempotencyKey
        )
        guard let id = r.data?.id, let path = r.data?.uploadPath else {
            throw APIError(statusCode: nil, code: nil, message: "Invalid upload session")
        }
        return (id, path)
    }

    public static func finalizeUploadSession(
        sessionId: String,
        objectPath: String,
        mimeType: String,
        sizeBytes: Int,
        idempotencyKey: String
    ) async throws {
        // Rely on APIClient convertToSnakeCase (objectPath → object_path, etc.).
        // Do not also declare snake_case CodingKeys — that can double-transform on some SDKs.
        struct Body: Encodable {
            let objectPath: String
            let mimeType: String
            let sizeBytes: Int
        }
        try await APIClient.shared.requestVoid(
            path: "media/upload-sessions/\(sessionId)/finalize",
            method: "POST",
            body: Body(objectPath: objectPath, mimeType: mimeType, sizeBytes: sizeBytes),
            idempotencyKey: idempotencyKey
        )
    }
}
