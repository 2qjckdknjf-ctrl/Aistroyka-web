//
//  PushRegistrationService.swift
//  AiStroykaWorker
//
//  Phase 7.5 — Store APNS token (Keychain), register with backend when auth available. Token never logged or shown in UI.
//

import Foundation

/// Stores push token and registers with API when user is logged in. Token is never logged or displayed.
enum PushRegistrationService {
    static func saveToken(_ token: String) {
        _ = KeychainHelper.set(key: KeychainHelper.pushTokenKey, value: token)
    }

    static func getToken() -> String? {
        KeychainHelper.get(key: KeychainHelper.pushTokenKey)
    }

    /// Call after login or when APNS token is received. Registers current token with backend if we have both token and auth.
    static func registerIfNeeded() {
        guard let token = getToken(), !token.isEmpty else { return }
        Task {
            do {
                try await WorkerAPI.registerDevice(pushToken: token)
            } catch {
                // Silent; will retry on next launch or when token is received again
            }
        }
    }
}
