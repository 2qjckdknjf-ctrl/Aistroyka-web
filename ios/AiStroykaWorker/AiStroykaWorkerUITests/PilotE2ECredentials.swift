//
//  PilotE2ECredentials.swift
//  AiStroykaWorkerUITests
//
//  Optional live pilot credentials from the test runner environment (never commit secrets).
//  Also reads ios/Config/.uitest-e2e-credentials (written by run-ios-e2e-integration-local.sh).
//

import Foundation
import XCTest

enum PilotE2ECredentials {
    static var email: String? {
        firstNonEmpty(
            "IOS_E2E_WORKER_EMAIL",
            "IOS_E2E_EMAIL",
            "SMOKE_EMAIL",
            "E2E_EMAIL"
        )
    }

    static var password: String? {
        firstNonEmpty(
            "IOS_E2E_WORKER_PASSWORD",
            "IOS_E2E_PASSWORD",
            "SMOKE_PASSWORD",
            "E2E_PASSWORD"
        )
    }

    static var projectId: String? {
        firstNonEmpty(
            "IOS_E2E_PROJECT_ID",
            "AISTROYKA_E2E_PROJECT_ID",
            "PILOT_SMOKE_PROJECT_ID_PRODUCTION",
            "PILOT_E2E_PROJECT_ID"
        )
    }

    static var apiBaseURL: String? {
        firstNonEmpty("IOS_E2E_BASE_URL", "AISTROYKA_E2E_BASE_URL", "BASE_URL", "PILOT_E2E_BASE_URL")
    }

    static var supabaseURL: String? {
        firstNonEmpty("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    }

    static var supabaseAnonKey: String? {
        firstNonEmpty("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }

    static var accessToken: String? {
        firstNonEmpty("IOS_E2E_ACCESS_TOKEN", "AISTROYKA_E2E_ACCESS_TOKEN")
    }

    static var userId: String? {
        firstNonEmpty("IOS_E2E_USER_ID", "AISTROYKA_E2E_USER_ID")
    }

    static var credentialsFilePath: String {
        credentialsFileURL.path
    }

    static var isConfigured: Bool {
        (email != nil && password != nil) || (accessToken != nil && userId != nil)
    }

    static func skipUnlessConfigured(_ testCase: XCTestCase) throws {
        guard isConfigured else {
            throw XCTSkip(
                "Set pilot credentials in .env.pilot and run via ios/scripts/run-ios-e2e-integration-local.sh "
                    + "(or export IOS_E2E_* / SMOKE_EMAIL)"
            )
        }
    }

    private static func firstNonEmpty(_ keys: String...) -> String? {
        for key in keys {
            if let v = nonEmptyEnv(key) { return v }
        }
        return nil
    }

    private static func nonEmptyEnv(_ key: String) -> String? {
        let fromProcess = ProcessInfo.processInfo.environment[key]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !fromProcess.isEmpty { return fromProcess }
        return valueFromCredentialsFile(key)
    }

    private static var credentialsFileURL: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("Config/.uitest-e2e-credentials")
    }

    private static func valueFromCredentialsFile(_ key: String) -> String? {
        guard let text = try? String(contentsOf: credentialsFileURL, encoding: .utf8) else { return nil }
        for raw in text.split(whereSeparator: \.isNewline) {
            var line = String(raw).trimmingCharacters(in: .whitespaces)
            if line.isEmpty || line.hasPrefix("#") { continue }
            if line.hasPrefix("export ") {
                line = String(line.dropFirst(7)).trimmingCharacters(in: .whitespaces)
            }
            guard let eq = line.firstIndex(of: "=") else { continue }
            let k = String(line[..<eq]).trimmingCharacters(in: .whitespaces)
            guard k == key else { continue }
            var v = String(line[line.index(after: eq)...]).trimmingCharacters(in: .whitespaces)
            if (v.hasPrefix("\"") && v.hasSuffix("\"")) || (v.hasPrefix("'") && v.hasSuffix("'")) {
                v = String(v.dropFirst().dropLast())
            }
            return v.isEmpty ? nil : v
        }
        return nil
    }
}
