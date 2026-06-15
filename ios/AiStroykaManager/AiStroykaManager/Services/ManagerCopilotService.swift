//
//  ManagerCopilotService.swift
//  Intelligence + copilot stream for Manager app.
//

import Foundation
import Shared

enum ManagerCopilotService {
    static func projectIntelligence(projectId: String) async throws -> ProjectIntelligenceDataDTO {
        let r: ProjectIntelligenceResponse = try await APIClient.shared.request(
            path: "projects/\(projectId)/intelligence",
            keyDecoding: .useDefaultKeys
        )
        guard let data = r.data else {
            throw APIError(statusCode: nil, code: nil, message: "No intelligence data")
        }
        return data
    }

    static func streamCopilotChat(
        projectId: String,
        threadId: String?,
        userText: String,
        decisionContext: DecisionContextPayload,
        locale: String?,
        onEvent: @escaping @Sendable (CopilotSSEEvent) -> Void
    ) async throws -> CopilotStreamDone? {
        let body = CopilotStreamRequestBody(
            threadId: threadId,
            userText: userText,
            decisionContext: decisionContext,
            locale: locale
        )
        let path = "projects/\(projectId)/copilot/chat/stream"
        let (bytes, http) = try await APIClient.shared.postForStream(path: path, body: body)
        if http.value(forHTTPHeaderField: "X-Stream-Status") == "unavailable" {
            throw APIError(statusCode: 503, code: "stream_unavailable", message: "Streaming unavailable")
        }
        return try await CopilotSSEParser.consume(bytes: bytes, onEvent: onEvent)
    }
}
