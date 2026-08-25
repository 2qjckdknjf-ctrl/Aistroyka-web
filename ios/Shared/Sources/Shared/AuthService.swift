//
//  AuthService.swift
//  Shared
//

import Foundation

/// Supabase Auth via REST (no SPM required). For production consider supabase-swift.
public actor AuthService {
    public static let shared = AuthService()
    private var cachedSession: (token: String, user: AuthUser)?

    public struct AuthUser {
        public let id: String
        public let email: String?
    }

    public func currentSession() async -> (token: String, user: AuthUser)? {
        if let c = cachedSession { return c }
        if let token = KeychainHelper.get(key: KeychainHelper.sessionTokenKey),
           let userId = KeychainHelper.get(key: KeychainHelper.sessionUserIdKey) {
            let email = KeychainHelper.get(key: KeychainHelper.sessionEmailKey)
            cachedSession = (token, AuthUser(id: userId, email: email))
            return cachedSession
        }
        return nil
    }

    public func signIn(email: String, password: String) async throws {
        let raw = Config.supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let base = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !base.isEmpty,
              let url = URL(string: "\(base)/auth/v1/token?grant_type=password"),
              url.scheme != nil, url.host != nil else {
            throw APIError(statusCode: nil, code: nil, message: "Supabase URL not configured. Set SUPABASE_URL in Config/Secrets.xcconfig or Scheme environment.")
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONEncoder().encode(["email": email, "password": password])

        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse else { throw APIError(statusCode: nil, code: nil, message: "Invalid response") }
        guard http.statusCode == 200 else {
            let err = APIError.from(data: data, response: res)
            throw err
        }
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let accessToken = json?["access_token"] as? String,
              let user = json?["user"] as? [String: Any],
              let uid = user["id"] as? String else {
            throw APIError(statusCode: nil, code: nil, message: "Invalid token response")
        }
        persistSession(accessToken: accessToken, userId: uid, email: (user["email"] as? String) ?? email)
    }

    public func signInWithApple(idToken: String, nonce: String?, fullName: String?) async throws {
        let raw = Config.supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let base = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !base.isEmpty,
              let url = URL(string: "\(base)/auth/v1/token?grant_type=id_token"),
              url.scheme != nil, url.host != nil else {
            throw APIError(statusCode: nil, code: nil, message: "Supabase URL not configured. Set SUPABASE_URL in Config/Secrets.xcconfig or Scheme environment.")
        }

        var payload: [String: Any] = [
            "provider": "apple",
            "id_token": idToken
        ]
        if let nonce, !nonce.isEmpty {
            payload["nonce"] = nonce
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse else { throw APIError(statusCode: nil, code: nil, message: "Invalid response") }
        guard http.statusCode == 200 else {
            let err = APIError.from(data: data, response: res)
            throw err
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let accessToken = json?["access_token"] as? String,
              let user = json?["user"] as? [String: Any],
              let uid = user["id"] as? String else {
            throw APIError(statusCode: nil, code: nil, message: "Invalid token response")
        }
        persistSession(accessToken: accessToken, userId: uid, email: user["email"] as? String)

        if let fullName, !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            await updateAuthUserMetadata(accessToken: accessToken, fullName: fullName)
        }
    }

    /// Live E2E: seed session from host-prefetched Supabase token (see `run-ios-e2e-integration-local.sh`).
    public func seedE2ESession(accessToken: String, userId: String, email: String?) {
        persistSession(accessToken: accessToken, userId: userId, email: email)
    }

    public func requestPhoneOtp(phone: String) async throws {
        let raw = Config.supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let base = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !base.isEmpty,
              let url = URL(string: "\(base)/auth/v1/otp"),
              url.scheme != nil, url.host != nil else {
            throw APIError(statusCode: nil, code: nil, message: "Supabase URL not configured. Set SUPABASE_URL in Config/Secrets.xcconfig or Scheme environment.")
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        struct OtpBody: Encodable {
            let phone: String
            let createUser = true
            let channel = "sms"
            enum CodingKeys: String, CodingKey {
                case phone
                case createUser = "create_user"
                case channel
            }
        }
        req.httpBody = try JSONEncoder().encode(OtpBody(phone: phone))
        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse else { throw APIError(statusCode: nil, code: nil, message: "Invalid response") }
        guard http.statusCode == 200 else {
            throw APIError.from(data: data, response: res)
        }
    }

    public func verifyPhoneOtp(phone: String, token: String) async throws {
        let raw = Config.supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let base = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !base.isEmpty,
              let url = URL(string: "\(base)/auth/v1/verify"),
              url.scheme != nil, url.host != nil else {
            throw APIError(statusCode: nil, code: nil, message: "Supabase URL not configured. Set SUPABASE_URL in Config/Secrets.xcconfig or Scheme environment.")
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONEncoder().encode(["type": "sms", "phone": phone, "token": token])
        let (data, res) = try await URLSession.shared.data(for: req)
        guard let http = res as? HTTPURLResponse else { throw APIError(statusCode: nil, code: nil, message: "Invalid response") }
        guard http.statusCode == 200 else {
            throw APIError.from(data: data, response: res)
        }
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let accessToken = json?["access_token"] as? String,
              let user = json?["user"] as? [String: Any],
              let uid = user["id"] as? String else {
            throw APIError(statusCode: nil, code: nil, message: "Invalid token response")
        }
        _ = KeychainHelper.set(key: KeychainHelper.sessionTokenKey, value: accessToken)
        _ = KeychainHelper.set(key: KeychainHelper.sessionUserIdKey, value: uid)
        cachedSession = (accessToken, AuthUser(id: uid, email: user["email"] as? String))
    }

    public func signOut() async {
        cachedSession = nil
        KeychainHelper.delete(key: KeychainHelper.sessionTokenKey)
        KeychainHelper.delete(key: KeychainHelper.sessionUserIdKey)
        KeychainHelper.delete(key: KeychainHelper.sessionEmailKey)
    }

    private func persistSession(accessToken: String, userId: String, email: String?) {
        cachedSession = (accessToken, AuthUser(id: userId, email: email))
        _ = KeychainHelper.set(key: KeychainHelper.sessionTokenKey, value: accessToken)
        _ = KeychainHelper.set(key: KeychainHelper.sessionUserIdKey, value: userId)
        if let email, !email.isEmpty {
            _ = KeychainHelper.set(key: KeychainHelper.sessionEmailKey, value: email)
        } else {
            KeychainHelper.delete(key: KeychainHelper.sessionEmailKey)
        }
    }

    public func getAccessToken() async -> String? {
        await currentSession()?.token
    }

    private func updateAuthUserMetadata(accessToken: String, fullName: String) async {
        let raw = Config.supabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let base = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !base.isEmpty, let url = URL(string: "\(base)/auth/v1/user") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        let payload: [String: Any] = [
            "data": ["full_name": fullName]
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        _ = try? await URLSession.shared.data(for: req)
    }
}
