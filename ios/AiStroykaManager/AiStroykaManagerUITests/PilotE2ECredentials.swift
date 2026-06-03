//
//  PilotE2ECredentials.swift
//  AiStroykaManagerUITests
//
//  Optional live pilot credentials from the test runner environment (never commit secrets).
//

import Foundation
import XCTest

enum PilotE2ECredentials {
    static var email: String? {
        nonEmptyEnv("IOS_E2E_MANAGER_EMAIL")
            ?? nonEmptyEnv("IOS_E2E_EMAIL")
            ?? nonEmptyEnv("SMOKE_EMAIL")
            ?? nonEmptyEnv("E2E_EMAIL")
    }

    static var password: String? {
        nonEmptyEnv("IOS_E2E_MANAGER_PASSWORD")
            ?? nonEmptyEnv("IOS_E2E_PASSWORD")
            ?? nonEmptyEnv("SMOKE_PASSWORD")
            ?? nonEmptyEnv("E2E_PASSWORD")
    }

    static var isConfigured: Bool {
        email != nil && password != nil
    }

    static func skipUnlessConfigured(_ testCase: XCTestCase) throws {
        guard isConfigured else {
            throw XCTSkip("Set IOS_E2E_MANAGER_EMAIL/IOS_E2E_MANAGER_PASSWORD (or SMOKE_EMAIL/SMOKE_PASSWORD) for live pilot E2E")
        }
    }

    private static func nonEmptyEnv(_ key: String) -> String? {
        let v = ProcessInfo.processInfo.environment[key]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return v.isEmpty ? nil : v
    }
}
