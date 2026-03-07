//
//  Config.swift
//  AiStroykaWorker
//

import Foundation

enum Config {
    private static let bundle = Bundle.main
    
    static var baseURL: String {
        (bundle.object(forInfoDictionaryKey: "BASE_URL") as? String)
            ?? ProcessInfo.processInfo.environment["BASE_URL"]
            ?? "http://localhost:3000"
    }
    
    static var supabaseURL: String {
        (bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String)
            ?? ProcessInfo.processInfo.environment["SUPABASE_URL"]
            ?? ""
    }
    
    static var supabaseAnonKey: String {
        (bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String)
            ?? ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
            ?? ""
    }
    
    /// Base for v1 API: e.g. http://localhost:3000/api/v1
    static var apiBaseURL: URL? {
        let b = baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: "\(b)/api/v1")
    }
}
