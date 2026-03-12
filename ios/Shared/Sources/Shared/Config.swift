//
//  Config.swift
//  Shared
//

import Foundation

public enum Config {
    private static let bundle = Bundle.main

    public static var baseURL: String {
        (bundle.object(forInfoDictionaryKey: "BASE_URL") as? String)
            ?? ProcessInfo.processInfo.environment["BASE_URL"]
            ?? "http://localhost:3000"
    }

    public static var supabaseURL: String {
        (bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String)
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? ""
    }

    public static var supabaseAnonKey: String {
        (bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String)
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""
    }

    /// Base for v1 API: e.g. http://localhost:3000/api/v1
    public static var apiBaseURL: URL? {
        let b = baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: "\(b)/api/v1")
    }
}
