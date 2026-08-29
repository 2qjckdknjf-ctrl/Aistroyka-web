//
//  WorkerV43API.swift
//  AiStroykaWorker
//
//  Isolated adapters for Worker V4.3 surfaces that sit on existing /api/v1/worker routes.
//

import Foundation
import Shared

enum WorkerV43API {
    private struct Envelope<T: Decodable>: Decodable {
        let data: T?
        let error: String?
    }

    static func issues(projectId: String, status: String? = nil) async throws -> [WorkerIssueDTO] {
        var path = "worker/issues?project_id=\(enc(projectId))"
        if let status, !status.isEmpty {
            path += "&status=\(enc(status))"
        }
        let env: Envelope<[WorkerIssueDTO]> = try await APIClient.shared.request(path: path, keyDecoding: .useDefaultKeys)
        let list = env.data ?? []
        WorkerCacheStore.save(list, key: cacheKey("issues", projectId))
        return list
    }

    static func issue(projectId: String, issueId: String) async throws -> WorkerIssueDTO {
        let env: Envelope<WorkerIssueDTO> = try await APIClient.shared.request(
            path: "worker/issues/\(issueId)?project_id=\(enc(projectId))",
            keyDecoding: .useDefaultKeys
        )
        guard let data = env.data else {
            throw APIError(statusCode: nil, code: nil, message: env.error ?? "No issue data")
        }
        return data
    }

    static func cachedIssues(projectId: String) -> [WorkerIssueDTO] {
        WorkerCacheStore.load([WorkerIssueDTO].self, key: cacheKey("issues", projectId)) ?? []
    }

    static func createIssue(
        projectId: String,
        title: String,
        description: String?,
        taskId: String?,
        idempotencyKey: String
    ) async throws -> WorkerIssueDTO {
        struct Body: Encodable {
            let projectId: String
            let title: String
            let description: String?
            let taskId: String?
            enum CodingKeys: String, CodingKey {
                case projectId = "project_id"
                case title
                case description
                case taskId = "task_id"
            }
        }
        let env: Envelope<WorkerIssueDTO> = try await APIClient.shared.request(
            path: "worker/issues",
            method: "POST",
            body: Body(projectId: projectId, title: title, description: description, taskId: taskId),
            idempotencyKey: idempotencyKey,
            keyDecoding: .useDefaultKeys
        )
        guard let data = env.data else {
            throw APIError(statusCode: nil, code: nil, message: env.error ?? "No issue data")
        }
        return data
    }

    static func updateIssue(
        projectId: String,
        issueId: String,
        status: String?,
        description: String?,
        idempotencyKey: String,
        evidenceUploadSessionId: String? = nil
    ) async throws -> WorkerIssueDTO {
        struct Body: Encodable {
            let status: String?
            let description: String?
            let evidenceUploadSessionId: String?
            enum CodingKeys: String, CodingKey {
                case status
                case description
                case evidenceUploadSessionId = "evidence_upload_session_id"
            }
        }
        let env: Envelope<WorkerIssueDTO> = try await APIClient.shared.request(
            path: "worker/issues/\(issueId)?project_id=\(enc(projectId))",
            method: "PATCH",
            body: Body(status: status, description: description, evidenceUploadSessionId: evidenceUploadSessionId),
            idempotencyKey: idempotencyKey,
            keyDecoding: .useDefaultKeys
        )
        guard let data = env.data else {
            throw APIError(statusCode: nil, code: nil, message: env.error ?? "No issue data")
        }
        return data
    }

    static func documents(projectId: String) async throws -> [WorkerDocumentDTO] {
        let env: Envelope<[WorkerDocumentDTO]> = try await APIClient.shared.request(
            path: "worker/documents?project_id=\(enc(projectId))",
            keyDecoding: .useDefaultKeys
        )
        let list = env.data ?? []
        WorkerCacheStore.save(list, key: cacheKey("documents", projectId))
        return list
    }

    static func cachedDocuments(projectId: String) -> [WorkerDocumentDTO] {
        WorkerCacheStore.load([WorkerDocumentDTO].self, key: cacheKey("documents", projectId)) ?? []
    }

    /// Server-validated invite token only. Never send a raw project id.
    static func joinSite(token: String, idempotencyKey: String) async throws {
        struct Body: Encodable { let token: String }
        struct Ack: Decodable { let data: JoinData? }
        struct JoinData: Decodable { let role: String? }
        let _: Ack = try await APIClient.shared.request(
            path: "worker/site-join",
            method: "POST",
            body: Body(token: token),
            idempotencyKey: idempotencyKey
        )
    }

    /// GET /api/v1/projects/:id/media — latest assigned-project photo.
    /// The server returns a short-lived signed URL; this optional request is bounded so it cannot hold core task UI.
    static func latestSitePhotoURL(projectId: String) async throws -> URL? {
        try await withThrowingTaskGroup(of: URL?.self) { group in
            group.addTask {
                try await fetchLatestSitePhotoURL(projectId: projectId)
            }
            group.addTask {
                try await Task.sleep(nanoseconds: 5_000_000_000)
                throw URLError(.timedOut)
            }
            guard let first = try await group.next() else { return nil }
            group.cancelAll()
            return first
        }
    }

    private static func fetchLatestSitePhotoURL(projectId: String) async throws -> URL? {
        struct Item: Decodable {
            let id: String?
            let fileUrl: String?
            let type: String?
        }
        struct Envelope: Decodable { let data: [Item]? }
        let env: Envelope = try await APIClient.shared.request(
            path: "projects/\(enc(projectId))/media?limit=1"
        )
        let raw = env.data?.compactMap { $0.fileUrl?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first { $0.lowercased().hasPrefix("https://") }
        if let raw, let url = URL(string: raw) {
            if let key = userScopedCacheKey("cover", projectId) {
                WorkerCacheStore.save(raw, key: key)
            }
            return url
        }
        return cachedSitePhotoURL(projectId: projectId)
    }

    static func cachedSitePhotoURL(projectId: String) -> URL? {
        guard
            let key = userScopedCacheKey("cover", projectId),
            let raw = WorkerCacheStore.load(String.self, key: key)
        else { return nil }
        return URL(string: raw)
    }

    private static func userScopedCacheKey(_ kind: String, _ projectId: String) -> String? {
        guard
            let userId = KeychainHelper.get(key: KeychainHelper.sessionUserIdKey)?
                .trimmingCharacters(in: .whitespacesAndNewlines),
            !userId.isEmpty
        else { return nil }
        return "wrk.v43.\(kind).\(userId).\(projectId)"
    }

    private static func enc(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
    }

    private static func cacheKey(_ kind: String, _ projectId: String) -> String {
        "wrk.v43.\(kind).\(projectId)"
    }
}
