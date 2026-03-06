//
//  LocalReminderService.swift
//  WorkerLite
//
//  Phase 7.5 — Local notifications: submit report by EOD, add after photo if before exists >N hours.
//

import Foundation
import UserNotifications

enum LocalReminderService {
    private static let afterPhotoDelayHours: Double = 2
    private static let endOfDayHour = 18
    private static let endOfDayMinute = 0

    /// Call when app state may have changed (e.g. after save). Schedules or cancels reminders.
    static func update(from state: AppStateStore) {
        cancelAll()
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized else { return }
            scheduleSubmitReminder(shiftStarted: state.shift.isStarted, hasDraft: state.draftReportId != nil, dayId: state.shift.dayId)
            scheduleAfterPhotoReminder(state: state)
        }
    }

    private static func cancelAll() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [
            "workerlite.submit",
            "workerlite.after"
        ])
    }

    private static func scheduleSubmitReminder(shiftStarted: Bool, hasDraft: Bool, dayId: String?) {
        guard shiftStarted, hasDraft, dayId != nil else { return }
        var comp = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        comp.hour = endOfDayHour
        comp.minute = endOfDayMinute
        guard let date = Calendar.current.date(from: comp), date > Date() else { return }
        let trigger = UNCalendarNotificationTrigger(dateMatching: comp, repeats: false)
        let content = UNMutableNotificationContent()
        content.title = "Report pending"
        content.body = "Submit your daily report before end of day."
        content.sound = .default
        let request = UNNotificationRequest(identifier: "workerlite.submit", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private static func scheduleAfterPhotoReminder(state: AppStateStore) {
        guard state.draftReportId != nil else { return }
        let beforeItems = state.pendingUploads.filter { $0.purpose == "report_before" }
        let afterItems = state.pendingUploads.filter { $0.purpose == "report_after" }
        let hasBefore = !beforeItems.isEmpty
        let hasAfter = !afterItems.isEmpty
        guard hasBefore, !hasAfter, let firstBefore = beforeItems.first else { return }
        let createdAt = ISO8601DateFormatter().date(from: firstBefore.createdAt) ?? Date()
        let reminderAt = createdAt.addingTimeInterval(afterPhotoDelayHours * 3600)
        guard reminderAt > Date() else { return }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: reminderAt.timeIntervalSinceNow, repeats: false)
        let content = UNMutableNotificationContent()
        content.title = "After photo"
        content.body = "Add your after photo to complete the report."
        content.sound = .default
        let request = UNNotificationRequest(identifier: "workerlite.after", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }
}
