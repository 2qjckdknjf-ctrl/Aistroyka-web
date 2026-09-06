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
        idempotencyKey: String,
        evidenceUploadSessionId: String? = nil
    ) async throws -> WorkerIssueDTO {
        struct Body: Encodable {
            let projectId: String
            let title: String
            let description: String?
            let taskId: String?
            let evidenceUploadSessionId: String?
            enum CodingKeys: String, CodingKey {
                case projectId = "project_id"
                case title
                case description
                case taskId = "task_id"
                case evidenceUploadSessionId = "evidence_upload_session_id"
            }
        }
        let env: Envelope<WorkerIssueDTO> = try await APIClient.shared.request(
            path: "worker/issues",
            method: "POST",
            body: Body(
                projectId: projectId,
                title: title,
                description: description,
                taskId: taskId,
                evidenceUploadSessionId: evidenceUploadSessionId
            ),
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

    /// Join immediately, then refresh the project list. On failure the token is kept for retry.
    static func joinFromInviteToken(_ token: String) async throws {
        do {
            try await joinSite(token: token, idempotencyKey: DeviceContext.newIdempotencyKey())
            var settings = WorkerSettingsStore.load()
            settings.pendingInviteToken = nil
            WorkerSettingsStore.save(settings)
            await MainActor.run {
                NotificationCenter.default.post(name: .workerProjectsChanged, object: nil)
            }
        } catch {
            var settings = WorkerSettingsStore.load()
            settings.pendingInviteToken = token
            WorkerSettingsStore.save(settings)
            throw error
        }
    }

    static func applyPendingInviteIfNeeded() async {
        let settings = WorkerSettingsStore.load()
        guard let token = settings.pendingInviteToken?.trimmingCharacters(in: .whitespacesAndNewlines), !token.isEmpty else {
            return
        }
        do {
            try await joinFromInviteToken(token)
        } catch {
            // Keep the token for a later retry once the session can call site-join.
        }
    }

    private static func enc(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
    }

    private static func cacheKey(_ kind: String, _ projectId: String) -> String {
        "wrk.v43.\(kind).\(projectId)"
    }
}
