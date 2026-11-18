//
//  ManagerV43Formatters.swift
//  Shared
//
//  Pure formatting for Manager V4.3 screens. No UI, no secrets.
//

import Foundation

public enum ManagerV43Formatters {
    public static func clampedProgress(_ value: Double) -> Double {
        min(1, max(0, value))
    }

    public static func percentLabel(_ value: Double) -> String {
        "\(Int((clampedProgress(value) * 100).rounded()))%"
    }

    public static func compactCurrency(_ amount: Double, currencyCode: String, locale: Locale = .current) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = locale
        formatter.maximumFractionDigits = amount >= 1_000_000 ? 1 : 0
        formatter.minimumFractionDigits = 0
        let scaled: Double
        let suffix: String
        let ru = isRussian(locale)
        if abs(amount) >= 1_000_000_000 {
            scaled = amount / 1_000_000_000
            suffix = ru ? " млрд" : "B"
        } else if abs(amount) >= 1_000_000 {
            scaled = amount / 1_000_000
            suffix = ru ? " млн" : "M"
        } else if abs(amount) >= 1_000 {
            scaled = amount / 1_000
            suffix = ru ? " тыс" : "K"
        } else {
            scaled = amount
            suffix = ""
        }
        let number = formatter.string(from: NSNumber(value: scaled)) ?? "\(scaled)"
        let symbol = currencySymbol(currencyCode, locale: locale)
        return "\(number)\(suffix) \(symbol)"
    }

    public static func delayLabel(days: Int, locale: Locale = .current) -> String {
        let ru = isRussian(locale)
        if days == 0 { return ru ? "По плану" : "On schedule" }
        let sign = days > 0 ? "+" : ""
        let unit = ru ? "дней" : (abs(days) == 1 ? "day" : "days")
        return "\(sign)\(days) \(unit)"
    }

    public static func relativeTime(_ date: Date, now: Date = Date(), locale: Locale = .current) -> String {
        let minutes = Int(now.timeIntervalSince(date) / 60)
        let ru = isRussian(locale)
        if minutes < 1 { return ru ? "сейчас" : "now" }
        if minutes < 60 { return "\(minutes) \(ru ? "мин" : "min")" }
        let hours = minutes / 60
        if hours < 24 { return "\(hours) \(ru ? "ч" : "h")" }
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }

    public static func riskDecisionAuditLine(
        actor: String,
        decision: String,
        comment: String?,
        source: String,
        at: Date,
        locale: Locale = Locale(identifier: "en_US_POSIX")
    ) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        let stamp = formatter.string(from: at)
        let note = (comment ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let notePart = note.isEmpty ? "" : " comment=\(note)"
        return "actor=\(actor) decision=\(decision) source=\(source) at=\(stamp)\(notePart)"
    }

    public static func reportQueueBucket(from status: String?) -> String {
        let normalized = (status ?? "").lowercased()
        switch normalized {
        case "approved":
            return "approved"
        case "rejected", "changes_requested":
            return "returned"
        case "submitted", "pending_review", "in_review", "review":
            return "review"
        case "draft":
            return "draft"
        default:
            return normalized.isEmpty ? "other" : "other"
        }
    }

    /// Explicit review-queue statuses only. Unknown/draft must not inflate the Tasks Review chip.
    public static func isReportPendingReview(_ status: String?) -> Bool {
        switch (status ?? "").lowercased() {
        case "submitted", "pending_review", "in_review", "review":
            return true
        default:
            return false
        }
    }

    public static func reportHasAIRemarks(analysisStatus: String?) -> Bool {
        let normalized = (analysisStatus ?? "").lowercased()
        return normalized.contains("flag")
            || normalized.contains("risk")
            || normalized.contains("fail")
            || normalized.contains("issue")
            || normalized.contains("deviation")
            || normalized.contains("reject")
    }

    public static func workerPresence(
        openShift: Bool?,
        noActivity: Bool?,
        lastStartedAt: String?,
        lastEndedAt: String?,
        now: Date = Date()
    ) -> String {
        if noActivity == true { return "offline" }
        if openShift == true { return "on_site" }
        if let started = parseISODate(lastStartedAt), now.timeIntervalSince(started) < 12 * 3600 {
            return lastEndedAt == nil ? "on_site" : "office"
        }
        if let ended = parseISODate(lastEndedAt), now.timeIntervalSince(ended) < 12 * 3600 {
            return "office"
        }
        return "offline"
    }

    public static func notificationNeedsAction(type: String?, readAt: String?) -> Bool {
        guard readAt == nil || (readAt ?? "").isEmpty else { return false }
        let normalized = (type ?? "").lowercased()
        if normalized.isEmpty { return true }
        return normalized.contains("risk")
            || normalized.contains("report")
            || normalized.contains("approv")
            || normalized.contains("review")
            || normalized.contains("assign")
            || normalized.contains("mention")
            || normalized.contains("action")
    }

    public static func dayGroup(createdAt: String?, now: Date = Date(), calendar: Calendar = .current) -> String {
        guard let date = parseISODate(createdAt) else { return "earlier" }
        if calendar.isDate(date, inSameDayAs: now) { return "today" }
        if let yesterday = calendar.date(byAdding: .day, value: -1, to: now),
           calendar.isDate(date, inSameDayAs: yesterday) {
            return "yesterday"
        }
        return "earlier"
    }

    public static func isPermissionDenied(_ message: String?) -> Bool {
        let normalized = (message ?? "").lowercased()
        return normalized.contains("403")
            || normalized.contains("forbidden")
            || normalized.contains("permission")
            || normalized.contains("not allowed")
            || normalized.contains("недостаточно прав")
    }

    public static func shortIdentifier(_ id: String) -> String {
        guard id.count > 10 else { return id }
        return String(id.prefix(8)) + "…"
    }

    public static func dayISO(_ date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    public static func isTaskOverdue(status: String?, dueDate: String?, now: Date = Date()) -> Bool {
        let normalized = (status ?? "").lowercased()
        switch normalized {
        case "done", "completed", "cancelled":
            return false
        default:
            break
        }
        guard let due = parseISODate(dueDate) else { return false }
        return due < Calendar.current.startOfDay(for: now)
    }

    public static func taskPriority(from status: String?, dueDate: String?, stored: String? = nil, now: Date = Date()) -> String {
        if let stored {
            let value = stored.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if value == "low" || value == "medium" || value == "high" { return value }
        }
        let normalized = (status ?? "").lowercased()
        if normalized.contains("review") || normalized.contains("check") { return "review" }
        if let due = parseISODate(dueDate), due < now, normalized != "done", normalized != "completed" {
            return "high"
        }
        if normalized == "done" || normalized == "completed" { return "low" }
        return "medium"
    }

    public static func parseISODate(_ raw: String?) -> Date? {
        guard let raw, !raw.isEmpty else { return nil }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: raw) { return date }
        iso.formatOptions = [.withInternetDateTime]
        if let date = iso.date(from: raw) { return date }
        if raw.count >= 10 {
            let day = String(raw.prefix(10))
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.date(from: day)
        }
        return nil
    }

    private static func currencySymbol(_ code: String, locale: Locale) -> String {
        if code.uppercased() == "RUB" || code == "₽" { return "₽" }
        return code
    }

    private static func isRussian(_ locale: Locale) -> Bool {
        (locale.languageCode ?? "").hasPrefix("ru")
    }
}
