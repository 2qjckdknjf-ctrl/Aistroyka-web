//
//  AiStroykaWorkerAppDelegate.swift
//  AiStroykaWorker
//
//  Phase 7.4 — Handle background URLSession completion.
//  Phase 7.5 — APNS registration, device register, push handling. Token never logged or shown in UI.
//

import UIKit
import UserNotifications
import Shared

/// Notification name for in-app handling of push payload (userInfo: type, task_id, etc.).
extension Notification.Name {
    static let aiStroykaWorkerPushPayload = Notification.Name("AiStroykaWorkerPushPayload")
}

final class AiStroykaWorkerAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        requestPushPermissionAndRegister(application: application)
        return true
    }

    func application(
        _ application: UIApplication,
        handleEventsForBackgroundURLSession identifier: String,
        completionHandler: @escaping () -> Void
    ) {
        guard identifier == "com.aistroyka.workerlite.uploads" else {
            completionHandler()
            return
        }
        BackgroundUploadService.shared.backgroundCompletionHandler = completionHandler
        BackgroundUploadService.shared.recreateSessionIfNeeded()
    }

    // MARK: - Remote Notifications (Phase 7.5)

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        PushRegistrationService.saveToken(tokenString)
        PushRegistrationService.registerIfNeeded()
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        // Do not log token; optional: log error.code only for diagnostics
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        handlePushPayload(userInfo)
        completionHandler(.newData)
    }

    private func requestPushPermissionAndRegister(application: UIApplication) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in }
        application.registerForRemoteNotifications()
    }

    private func handlePushPayload(_ userInfo: [AnyHashable: Any]) {
        let type = (userInfo["type"] as? String) ?? ""
        var payload: [AnyHashable: Any] = ["type": type]
        if let taskId = userInfo["task_id"] as? String { payload["task_id"] = taskId }
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .aiStroykaWorkerPushPayload,
                object: nil,
                userInfo: payload
            )
        }
    }
}
