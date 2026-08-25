//
//  WorkerV43Tokens.swift
//  AiStroykaWorker
//
//  iOS Worker V4.3 visual tokens (DESIGN_SYSTEM.md).
//

import SwiftUI

enum WorkerV43 {
    static let bg = Color(red: 3 / 255, green: 11 / 255, blue: 22 / 255)
    static let elevated = Color(red: 7 / 255, green: 20 / 255, blue: 37 / 255)
    static let card = Color(red: 9 / 255, green: 24 / 255, blue: 42 / 255)
    static let cardStrong = Color(red: 13 / 255, green: 32 / 255, blue: 54 / 255)
    static let border = Color(red: 32 / 255, green: 54 / 255, blue: 80 / 255)
    static let textPrimary = Color(red: 244 / 255, green: 247 / 255, blue: 252 / 255)
    static let textSecondary = Color(red: 163 / 255, green: 175 / 255, blue: 192 / 255)
    static let yellow = Color(red: 255 / 255, green: 196 / 255, blue: 0 / 255)
    static let yellowInk = Color(red: 5 / 255, green: 11 / 255, blue: 28 / 255)
    static let dataBlue = Color(red: 37 / 255, green: 151 / 255, blue: 255 / 255)
    static let cyan = Color(red: 34 / 255, green: 199 / 255, blue: 242 / 255)
    static let aiViolet = Color(red: 139 / 255, green: 92 / 255, blue: 246 / 255)
    static let success = Color(red: 39 / 255, green: 211 / 255, blue: 107 / 255)
    static let warning = Color(red: 255 / 255, green: 159 / 255, blue: 10 / 255)
    static let danger = Color(red: 255 / 255, green: 69 / 255, blue: 58 / 255)

    static let space1: CGFloat = 4
    static let space2: CGFloat = 8
    static let space3: CGFloat = 12
    static let space4: CGFloat = 16
    static let space5: CGFloat = 20
    static let space6: CGFloat = 24
    static let space8: CGFloat = 32
    static let screenX: CGFloat = 16
    static let touch: CGFloat = 44
    static let fieldTouch: CGFloat = 48
    static let ctaHeight: CGFloat = 56
    static let radiusCard: CGFloat = 16
    static let radiusLarge: CGFloat = 20
    static let radiusControl: CGFloat = 14
    static let radiusChip: CGFloat = 10
    static let motion: Double = 0.22
    static let tabBarHeight: CGFloat = 72
}

enum WorkerV43Formatters {
    static func clampedProgress(_ value: Double) -> Double {
        min(1, max(0, value))
    }

    static func percentLabel(_ value: Double) -> String {
        "\(Int((clampedProgress(value) * 100).rounded()))%"
    }

    static func compactDuration(from startedAt: Date, now: Date = Date()) -> String {
        let seconds = max(0, Int(now.timeIntervalSince(startedAt)))
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        if hours > 0 {
            return "\(hours) \(NSLocalizedString("wrk_v43_hours_short", comment: "")) \(minutes) \(NSLocalizedString("wrk_v43_minutes_short", comment: ""))"
        }
        return "\(minutes) \(NSLocalizedString("wrk_v43_minutes_short", comment: ""))"
    }

    static func clock(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }

    static func dayTitle(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = .current
        f.dateFormat = "d MMMM"
        return f.string(from: date)
    }

    static func relativeSync(_ date: Date?, now: Date = Date()) -> String {
        guard let date else { return NSLocalizedString("wrk_v43_sync_never", comment: "") }
        let minutes = max(0, Int(now.timeIntervalSince(date) / 60))
        if minutes < 1 { return NSLocalizedString("wrk_v43_sync_just_now", comment: "") }
        return String(format: NSLocalizedString("wrk_v43_sync_minutes_ago_fmt", comment: ""), minutes)
    }

    /// Extracts a server invite token. Rejects raw project IDs and unknown payloads.
    static func inviteToken(fromScan raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.count <= 2048 else { return nil }
        if let url = URL(string: trimmed) {
            if let token = url.queryItem("token") ?? url.queryItem("invite") {
                return sanitizedInviteToken(token)
            }
            if url.scheme?.lowercased() == "aistroyka" {
                let host = url.host?.lowercased()
                if host == "join" || host == "invite" {
                    return sanitizedInviteToken(url.queryItem("token") ?? url.lastPathComponent)
                }
            }
        }
        return sanitizedInviteToken(trimmed)
    }

    static func sanitizedInviteToken(_ raw: String?) -> String? {
        guard let raw else { return nil }
        let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard token.count >= 16, token.count <= 128 else { return nil }
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_"))
        guard token.unicodeScalars.allSatisfy({ allowed.contains($0) }) else { return nil }
        return token
    }

    static func normalizedPhone(_ raw: String) -> String? {
        let digits = raw.filter(\.isNumber)
        guard digits.count >= 10, digits.count <= 15 else { return nil }
        if digits.hasPrefix("8"), digits.count == 11 {
            return "+7\(digits.dropFirst())"
        }
        if digits.hasPrefix("7"), digits.count == 11 {
            return "+\(digits)"
        }
        return "+\(digits)"
    }
}

private extension URL {
    func queryItem(_ name: String) -> String? {
        URLComponents(url: self, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == name })?
            .value
    }
}
