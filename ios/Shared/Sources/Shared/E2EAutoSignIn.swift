//
//  E2EAutoSignIn.swift
//  Shared
//
//  Live pilot E2E: credentials from launch environment (set by UITest runner / local script).
//

import Foundation

public enum E2EAutoSignIn {
    public static var isEnabled: Bool {
        ProcessInfo.processInfo.environment["AISTROYKA_E2E"] == "1"
            || ProcessInfo.processInfo.arguments.contains("-AISTROYKA_E2E")
    }

    public static var email: String? {
        if let v = prefetchedValueFromCredentialsFile(
            "AISTROYKA_E2E_EMAIL", "IOS_E2E_EMAIL", "IOS_E2E_MANAGER_EMAIL", "SMOKE_EMAIL", "E2E_EMAIL"
        ) { return v }
        return firstNonEmpty(
            envKeys: "AISTROYKA_E2E_EMAIL", "IOS_E2E_EMAIL", "SMOKE_EMAIL", "E2E_EMAIL",
            argFlag: "-AISTROYKA_E2E_EMAIL"
        )
    }

    public static var password: String? {
        if let v = prefetchedValueFromCredentialsFile(
            "AISTROYKA_E2E_PASSWORD", "IOS_E2E_PASSWORD", "IOS_E2E_MANAGER_PASSWORD", "SMOKE_PASSWORD", "E2E_PASSWORD"
        ) { return v }
        return firstNonEmpty(
            envKeys: "AISTROYKA_E2E_PASSWORD", "IOS_E2E_PASSWORD", "SMOKE_PASSWORD", "E2E_PASSWORD",
            argFlag: "-AISTROYKA_E2E_PASSWORD"
        )
    }

    public static var canAutoSignIn: Bool {
        isEnabled && (hasPrefetchedSession || (email != nil && password != nil))
    }

    /// Optional: host script prefetches Supabase token (avoids flaky password grant on Simulator).
    public static var prefetchedAccessToken: String? {
        guard isEnabled else { return nil }
        if let v = prefetchedValueFromCredentialsFile(
            "IOS_E2E_ACCESS_TOKEN", "AISTROYKA_E2E_ACCESS_TOKEN"
        ) { return v }
        return firstNonEmpty(
            envKeys: "AISTROYKA_E2E_ACCESS_TOKEN", "IOS_E2E_ACCESS_TOKEN",
            argFlag: "-AISTROYKA_E2E_ACCESS_TOKEN"
        )
    }

    public static var prefetchedUserId: String? {
        guard isEnabled else { return nil }
        if let v = prefetchedValueFromCredentialsFile(
            "IOS_E2E_USER_ID", "AISTROYKA_E2E_USER_ID"
        ) { return v }
        return firstNonEmpty(
            envKeys: "AISTROYKA_E2E_USER_ID", "IOS_E2E_USER_ID",
            argFlag: "-AISTROYKA_E2E_USER_ID"
        )
    }

    private static func prefetchedValueFromCredentialsFile(_ keys: String...) -> String? {
        // Host path only (AISTROYKA_E2E_CRED_FILE / ios/Config/.uitest-e2e-credentials).
        // Credentials must never be bundled in the SPM target — see e2e-credentials.env.example.
        if let host = hostCredentialsText() {
            for key in keys {
                if let v = parseCredentialsValue(key, in: host) { return v }
            }
        }
        return nil
    }

    public static var hasPrefetchedSession: Bool {
        prefetchedAccessToken != nil && prefetchedUserId != nil
    }

    /// Live E2E API host (must match `IOS_E2E_BASE_URL` / preflight curl).
    public static var apiBaseURLOverride: String? {
        guard isEnabled else { return nil }
        if let v = prefetchedValueFromCredentialsFile(
            "IOS_E2E_BASE_URL", "AISTROYKA_E2E_BASE_URL", "BASE_URL"
        ) { return v }
        return firstNonEmpty(
            envKeys: "AISTROYKA_E2E_BASE_URL", "IOS_E2E_BASE_URL", "BASE_URL",
            argFlag: "-AISTROYKA_E2E_BASE_URL", altArgFlag: "-BASE_URL"
        )
    }

    public static var supabaseURLOverride: String? {
        guard isEnabled else { return nil }
        if let v = prefetchedValueFromCredentialsFile("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL") {
            return v
        }
        return firstNonEmpty(envKeys: "SUPABASE_URL", argFlag: "-SUPABASE_URL")
    }

    public static var supabaseAnonKeyOverride: String? {
        guard isEnabled else { return nil }
        if let v = prefetchedValueFromCredentialsFile(
            "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        ) { return v }
        return firstNonEmpty(envKeys: "SUPABASE_ANON_KEY", argFlag: "-SUPABASE_ANON_KEY")
    }

    private static func firstNonEmpty(
        envKeys: String...,
        argFlag: String? = nil,
        altArgFlag: String? = nil
    ) -> String? {
        for key in envKeys {
            if let v = nonEmptyProcessValue(key) { return v }
        }
        for flag in [argFlag, altArgFlag].compactMap({ $0 }) {
            if let v = nonEmptyArgumentValue(flag) { return v }
        }
        for key in envKeys {
            if let v = valueFromCredentialsFile(key) { return v }
        }
        return nil
    }

    private static func nonEmptyProcessValue(_ key: String) -> String? {
        let v = ProcessInfo.processInfo.environment[key]?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return v.isEmpty ? nil : v
    }

    private static func nonEmptyArgumentValue(_ flag: String) -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let idx = args.firstIndex(of: flag), idx + 1 < args.count else { return nil }
        let v = args[idx + 1].trimmingCharacters(in: .whitespacesAndNewlines)
        return v.isEmpty ? nil : v
    }

    /// Layer B E2E: credentials from gitignored `ios/Config/.uitest-e2e-credentials` via `AISTROYKA_E2E_CRED_FILE`.
    private static func valueFromCredentialsFile(_ key: String) -> String? {
        guard isEnabled else { return nil }
        if let host = hostCredentialsText(), let v = parseCredentialsValue(key, in: host) {
            return v
        }
        return nil
    }

    private static func parseCredentialsValue(_ key: String, in text: String) -> String? {
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

    #if targetEnvironment(simulator)
    private static func hostCredentialsText() -> String? {
        let path = nonEmptyProcessValue("AISTROYKA_E2E_CRED_FILE")
            ?? nonEmptyArgumentValue("-AISTROYKA_E2E_CRED_FILE")
        guard let path, let text = try? String(contentsOfFile: path, encoding: .utf8) else { return nil }
        return text
    }
    #else
    private static func hostCredentialsText() -> String? { nil }
    #endif
}
