//
//  SafeLog.swift
//  Shared
//
//  Strip tokens and common secret patterns before logging or crash breadcrumbs.
//

import Foundation

public enum SafeLog {
    /// Redacts `Bearer …`, rough JWT shapes, and `apikey=` fragments. Prefer this when logging URL requests or errors that may echo headers.
    public static func redactSecrets(_ text: String) -> String {
        var s = text
        let patterns: [(String, String)] = [
            (#"(?i)bearer\s+[a-z0-9\-_.]+"#,
             "Bearer [REDACTED]"),
            (#"(?i)apikey[\"']?\s*[:=]\s*[\"']?[^\"'\s]+"#,
             "apikey: [REDACTED]"),
            (#"(eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})"#,
             "[REDACTED_JWT]"),
        ]
        for (pattern, replacement) in patterns {
            if let re = try? NSRegularExpression(pattern: pattern, options: []) {
                let range = NSRange(s.startIndex..., in: s)
                s = re.stringByReplacingMatches(in: s, options: [], range: range, withTemplate: replacement)
            }
        }
        return s
    }
}
