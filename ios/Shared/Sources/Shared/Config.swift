//
//  Config.swift
//  Shared
//

import Foundation

public enum Config {
    /// Merged Info.plist from the host `.app`. Walk up from `Bundle.main.bundlePath` until `Info.plist` contains a resolved `SUPABASE_URL` (not `$(…)`).
    private static let appInfoPlist: [String: Any]? = {
        var url = URL(fileURLWithPath: Bundle.main.bundlePath)
        while url.path != "/" {
            let plistURL = url.appendingPathComponent("Info.plist")
            if let dict = NSDictionary(contentsOf: plistURL) as? [String: Any],
               let s = dict["SUPABASE_URL"] as? String,
               !s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
               !s.hasPrefix("$(") {
                return dict
            }
            url.deleteLastPathComponent()
        }
        return Bundle.main.infoDictionary
    }()

    private static func stringInfo(_ key: String) -> String? {
        guard let s = appInfoPlist?[key] as? String else { return nil }
        // xcconfig uses `\/` for slashes; merged plist can retain backslashes — normalize for URL(string:).
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "\\/", with: "/")
        if t.isEmpty || t.hasPrefix("$(") { return nil }
        return t
    }

    public static var baseURL: String {
        if let e2e = E2EAutoSignIn.apiBaseURLOverride {
            return e2e.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        }
        if E2EAutoSignIn.isEnabled,
           let launchBase = ProcessInfo.processInfo.environment["BASE_URL"]?
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !launchBase.isEmpty {
            return launchBase.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        }
        return stringInfo("BASE_URL")
            ?? ProcessInfo.processInfo.environment["BASE_URL"]
            ?? "http://localhost:3000"
    }

    public static var supabaseURL: String {
        if let e2e = E2EAutoSignIn.supabaseURLOverride {
            return e2e
        }
        if E2EAutoSignIn.isEnabled,
           let launch = ProcessInfo.processInfo.environment["SUPABASE_URL"]?
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !launch.isEmpty {
            return launch
        }
        return stringInfo("SUPABASE_URL")
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? ""
    }

    public static var supabaseAnonKey: String {
        if let e2e = E2EAutoSignIn.supabaseAnonKeyOverride {
            return e2e
        }
        if E2EAutoSignIn.isEnabled,
           let launch = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]?
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !launch.isEmpty {
            return launch
        }
        return stringInfo("SUPABASE_ANON_KEY")
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""
    }

    /// Base for v1 API: e.g. http://localhost:3000/api/v1/
    /// Trailing slash required — Foundation `URL(string:relativeTo:)` drops `/v1` without it.
    public static var apiBaseURL: URL? {
        let b = baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: "\(b)/api/v1/")
    }
}
