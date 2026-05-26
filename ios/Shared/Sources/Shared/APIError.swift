//
//  APIError.swift
//  Shared
//

import Foundation

public struct APIError: Error {
    public let statusCode: Int?
    public let code: String?
    public let message: String

    public init(statusCode: Int?, code: String?, message: String) {
        self.statusCode = statusCode
        self.code = code
        self.message = message
    }

    public static func from(data: Data?, response: URLResponse?) -> APIError {
        let code = (response as? HTTPURLResponse)?.statusCode
        var message = "Request failed"
        var apiCode: String?
        if let data = data,
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            message = (json["error"] as? String) ?? message
            apiCode = json["code"] as? String
        }
        return APIError(statusCode: code, code: apiCode, message: message)
    }

    public var isUnauthorized: Bool { statusCode == 401 }
    public var isForbidden: Bool { statusCode == 403 }
    public var isConflict: Bool { statusCode == 409 || code == "sync_conflict" }
    public var isRateLimited: Bool { statusCode == 429 }

    /// Stable copy for UI (already avoids raw JSON dumps in `from`).
    public var userFacingMessage: String { message }

    /// Rough classification for generic retry surfaces (views still map 409 / auth specially).
    public var isRetryable: Bool {
        guard let sc = statusCode else { return false }
        if sc == 401 || sc == 403 || sc == 404 { return false }
        return sc == 429 || sc >= 500
    }
}
