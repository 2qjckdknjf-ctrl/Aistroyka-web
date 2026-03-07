//
//  APIError.swift
//  AiStroykaWorker
//

import Foundation

struct APIError: Error {
    let statusCode: Int?
    let code: String?
    let message: String
    
    static func from(data: Data?, response: URLResponse?) -> APIError {
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
    
    var isUnauthorized: Bool { statusCode == 401 }
    var isForbidden: Bool { statusCode == 403 }
    var isConflict: Bool { statusCode == 409 || code == "sync_conflict" }
    var isRateLimited: Bool { statusCode == 429 }
}
