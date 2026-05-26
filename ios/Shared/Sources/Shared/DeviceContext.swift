//
//  DeviceContext.swift
//  Shared
//

import CryptoKit
import Foundation

/// Stable device ID (Keychain) and idempotency key generation. Used on ALL requests.
public enum DeviceContext {
    private static let lock = NSLock()
    private static var _deviceId: String?

    public static var deviceId: String {
        lock.lock()
        defer { lock.unlock() }
        if let id = _deviceId ?? KeychainHelper.getDeviceId() {
            _deviceId = id
            return id
        }
        let newId = UUID().uuidString
        _ = KeychainHelper.setDeviceId(newId)
        _deviceId = newId
        return newId
    }

    /// New UUID per write operation; persist for retries so retries use same key.
    public static func newIdempotencyKey() -> String {
        UUID().uuidString
    }

    /// Stable idempotency key for `POST /api/v1/devices/register` (same device + push token → same key for safe retries; new token → new key).
    public static func idempotencyKeyDeviceRegister(pushToken: String) -> String {
        let material = "\(deviceId)\u{1e}\(pushToken)"
        let digest = SHA256.hash(data: Data(material.utf8))
        let hex = digest.map { String(format: "%02x", $0) }.joined()
        return "device-register-\(hex)"
    }

    /// Stable idempotency key for `POST /api/v1/devices/unregister` (per device).
    public static func idempotencyKeyDeviceUnregister() -> String {
        let material = "\(deviceId)\u{1e}device-unregister"
        let digest = SHA256.hash(data: Data(material.utf8))
        let hex = digest.map { String(format: "%02x", $0) }.joined()
        return "device-unregister-\(hex)"
    }
}
