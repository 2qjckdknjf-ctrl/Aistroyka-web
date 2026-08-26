//
//  APIClient.swift
//  Shared
//

import Foundation

public extension Notification.Name {
    static let apiClientDidReceiveUnauthorized = Notification.Name("apiClientDidReceiveUnauthorized")
}

public actor APIClient {
    public static let shared = APIClient()
    private let session: URLSession
    private var tokenProvider: (() async -> String?)?
    /// x-client header. Default is field worker; apps call `AppRuntime.configureSharedNetworkingFor*`.
    private var clientProfile: String = MobileClientProfile.worker.rawValue

    public init(session: URLSession = .shared) {
        self.session = session
    }

    public func setTokenProvider(_ provider: @escaping () async -> String?) {
        tokenProvider = provider
    }

    public func setClientProfile(_ profile: String) {
        clientProfile = profile
    }

    public func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        idempotencyKey: String? = nil,
        keyDecoding: JSONDecoder.KeyDecodingStrategy = .convertFromSnakeCase
    ) async throws -> T {
        guard let base = Config.apiBaseURL else { throw APIError(statusCode: nil, code: nil, message: "Invalid base URL") }
        let pathTrimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: pathTrimmed, relativeTo: base) else { throw APIError(statusCode: nil, code: nil, message: "Invalid path") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(DeviceContext.deviceId, forHTTPHeaderField: "x-device-id")
        request.setValue(clientProfile, forHTTPHeaderField: "x-client")
        if let key = idempotencyKey {
            request.setValue(key, forHTTPHeaderField: "x-idempotency-key")
        }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let (data, response) = try await performData(request)
        if let code = (response as? HTTPURLResponse)?.statusCode, code >= 400 {
            throw APIError.from(data: data, response: response)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = keyDecoding
        return try decoder.decode(T.self, from: data)
    }

    /// POST with raw response for SSE streams (caller parses body).
    public func postForStream(
        path: String,
        body: Encodable
    ) async throws -> (URLSession.AsyncBytes, HTTPURLResponse) {
        guard let base = Config.apiBaseURL else { throw APIError(statusCode: nil, code: nil, message: "Invalid base URL") }
        let pathTrimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: pathTrimmed, relativeTo: base) else { throw APIError(statusCode: nil, code: nil, message: "Invalid path") }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(DeviceContext.deviceId, forHTTPHeaderField: "x-device-id")
        request.setValue(clientProfile, forHTTPHeaderField: "x-client")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        let (bytes, response) = try await performBytes(request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError(statusCode: nil, code: nil, message: "Invalid response")
        }
        if http.statusCode >= 400 {
            var data = Data()
            for try await chunk in bytes {
                data.append(chunk)
            }
            throw APIError.from(data: data, response: response)
        }
        return (bytes, http)
    }

    public func requestVoid(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        idempotencyKey: String? = nil
    ) async throws {
        let _: EmptyJSON = try await request(path: path, method: method, body: body, idempotencyKey: idempotencyKey)
    }

    /// POST multipart `file` field (cabinet document upload).
    public func uploadMultipartFile(
        path: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        fieldName: String = "file",
        idempotencyKey: String? = nil
    ) async throws {
        guard let base = Config.apiBaseURL else { throw APIError(statusCode: nil, code: nil, message: "Invalid base URL") }
        let pathTrimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: pathTrimmed, relativeTo: base) else { throw APIError(statusCode: nil, code: nil, message: "Invalid path") }
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(DeviceContext.deviceId, forHTTPHeaderField: "x-device-id")
        request.setValue(clientProfile, forHTTPHeaderField: "x-client")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let key = idempotencyKey {
            request.setValue(key, forHTTPHeaderField: "x-idempotency-key")
        }
        var body = Data()
        body.append(Data("--\(boundary)\r\n".utf8))
        body.append(Data("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".utf8))
        body.append(Data("Content-Type: \(mimeType)\r\n\r\n".utf8))
        body.append(fileData)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        request.httpBody = body
        let (data, response) = try await performData(request)
        if let code = (response as? HTTPURLResponse)?.statusCode, code >= 400 {
            throw APIError.from(data: data, response: response)
        }
    }

    /// Returns raw data and status for sync/changes so caller can decode 409 body (SyncConflictBody).
    public func requestDataAndResponse(path: String, method: String = "GET") async throws -> (Data, Int) {
        guard let base = Config.apiBaseURL else { throw APIError(statusCode: nil, code: nil, message: "Invalid base URL") }
        let pathTrimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: pathTrimmed, relativeTo: base) else { throw APIError(statusCode: nil, code: nil, message: "Invalid path") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(DeviceContext.deviceId, forHTTPHeaderField: "x-device-id")
        request.setValue(clientProfile, forHTTPHeaderField: "x-client")
        let (data, response) = try await performData(request)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        return (data, code)
    }

    private func applyAuth(_ request: inout URLRequest) async {
        if let token = await tokenProvider?() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    private func performData(_ request: URLRequest) async throws -> (Data, URLResponse) {
        var req = request
        await applyAuth(&req)
        var result = try await session.data(for: req)
        if (result.1 as? HTTPURLResponse)?.statusCode == 401 {
            if await AuthService.shared.refreshAfterUnauthorized() {
                await applyAuth(&req)
                result = try await session.data(for: req)
            }
            if (result.1 as? HTTPURLResponse)?.statusCode == 401 {
                await notifySessionInvalidIfNeeded()
            }
        }
        return result
    }

    private func performBytes(_ request: URLRequest) async throws -> (URLSession.AsyncBytes, URLResponse) {
        var req = request
        await applyAuth(&req)
        var result = try await session.bytes(for: req)
        if (result.1 as? HTTPURLResponse)?.statusCode == 401 {
            if await AuthService.shared.refreshAfterUnauthorized() {
                await applyAuth(&req)
                result = try await session.bytes(for: req)
            }
            if (result.1 as? HTTPURLResponse)?.statusCode == 401 {
                await notifySessionInvalidIfNeeded()
            }
        }
        return result
    }

    /// 401: notify host apps so they can sign out and avoid a stuck authenticated UI (Worker queue pauses without this).
    private func notifySessionInvalidIfNeeded() async {
        guard shouldEmitSessionExpiredNotification else { return }
        let profile = clientProfile
        await MainActor.run {
            NotificationCenter.default.post(
                name: .apiClientDidReceiveUnauthorized,
                object: nil,
                userInfo: ["clientProfile": profile]
            )
        }
    }

    private var shouldEmitSessionExpiredNotification: Bool {
        clientProfile == MobileClientProfile.manager.rawValue
            || clientProfile == MobileClientProfile.worker.rawValue
    }
}

private struct EmptyJSON: Decodable {}
private struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ value: Encodable) { self.value = value }
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}
