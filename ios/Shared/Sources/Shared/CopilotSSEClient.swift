//
//  CopilotSSEClient.swift
//  Shared — parse POST /copilot/chat/stream SSE (meta, token, done, error).
//

import Foundation

public struct CopilotStreamDone: Sendable {
    public let threadId: String
    public let requestId: String
    public let finalText: String
    public let fallbackReason: String?

    public init(threadId: String, requestId: String, finalText: String, fallbackReason: String?) {
        self.threadId = threadId
        self.requestId = requestId
        self.finalText = finalText
        self.fallbackReason = fallbackReason
    }
}

public struct CopilotStreamErrorEvent: Sendable {
    public let requestId: String
    public let message: String
    public let retryable: Bool
}

public enum CopilotSSEEvent: Sendable {
    case meta(requestId: String?, threadId: String?)
    case token(delta: String)
    case done(CopilotStreamDone)
    case transportError(String)
}

/// Consumes an SSE byte stream from copilot chat stream route.
public enum CopilotSSEParser {
    public static func consume(
        bytes: URLSession.AsyncBytes,
        onEvent: @escaping @Sendable (CopilotSSEEvent) -> Void
    ) async throws -> CopilotStreamDone? {
        var buffer = ""
        var currentEvent = ""
        var requestId = ""
        var threadId = ""
        var finalText = ""
        var fallbackReason: String?

        for try await line in bytes.lines {
            if line.hasPrefix("event: ") {
                currentEvent = String(line.dropFirst(7)).trimmingCharacters(in: .whitespaces)
                continue
            }
            if line.hasPrefix("data: ") {
                let dataStr = String(line.dropFirst(6))
                guard let data = dataStr.data(using: .utf8),
                      let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                else { continue }

                if let rid = obj["request_id"] as? String { requestId = rid }
                if let tid = obj["thread_id"] as? String { threadId = tid }

                switch currentEvent {
                case "meta":
                    onEvent(.meta(requestId: requestId.isEmpty ? nil : requestId, threadId: threadId.isEmpty ? nil : threadId))
                case "token":
                    if let delta = obj["delta"] as? String {
                        finalText += delta
                        onEvent(.token(delta: delta))
                    }
                case "done":
                    if let text = obj["final_text"] as? String { finalText = text }
                    if let fr = obj["fallback_reason"] as? String { fallbackReason = fr }
                    let done = CopilotStreamDone(
                        threadId: threadId,
                        requestId: requestId,
                        finalText: finalText,
                        fallbackReason: fallbackReason
                    )
                    onEvent(.done(done))
                    return done
                case "error":
                    let msg = (obj["message"] as? String) ?? "Stream error"
                    let retryable = (obj["retryable"] as? Bool) ?? false
                    onEvent(.transportError(msg))
                    throw APIError(statusCode: nil, code: nil, message: "\(msg) (retryable=\(retryable))")
                default:
                    break
                }
            }
        }
        return nil
    }
}
