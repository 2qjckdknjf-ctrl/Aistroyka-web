//
//  DeviceContext.swift
//  Shared
//

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
}
