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
        idempotencyKey: String? = nil
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
        if let token = await tokenProvider?() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let (data, response) = try await session.data(for: request)
        let http = response as? HTTPURLResponse

        if let code = http?.statusCode, code >= 400 {
            if code == 401 {
                await notifySessionInvalidIfNeeded()
            }
            throw APIError.from(data: data, response: response)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }

    public func requestVoid(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        idempotencyKey: String? = nil
    ) async throws {
        let _: EmptyJSON = try await request(path: path, method: method, body: body, idempotencyKey: idempotencyKey)
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
        if let token = await tokenProvider?() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        if code == 401 {
            await notifySessionInvalidIfNeeded()
        }
        return (data, code)
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
