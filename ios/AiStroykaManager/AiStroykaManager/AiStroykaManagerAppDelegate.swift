//
//  AiStroykaManagerAppDelegate.swift
//  AiStroyka Manager
//
//  APNS registration + task_message deep-link into Tasks tab chat.
//

import UIKit
import UserNotifications
import Shared

final class AiStroykaManagerAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in }
        application.registerForRemoteNotifications()
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        _ = KeychainHelper.set(key: KeychainHelper.pushTokenKey, value: tokenString)
        Task {
            do {
                try await ManagerAPI.registerDevice(pushToken: tokenString)
            } catch {
                // Silent retry on next login / token refresh
            }
        }
    }

    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        handlePush(userInfo)
        completionHandler(.newData)
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        handlePush(response.notification.request.content.userInfo)
        completionHandler()
    }

    private func handlePush(_ userInfo: [AnyHashable: Any]) {
        let type = (userInfo["type"] as? String) ?? ""
        guard type == "task_message" || type == "task_assigned" || type == "task_updated" else { return }
        guard let taskId = userInfo["task_id"] as? String, !taskId.isEmpty else { return }
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .aiStroykaManagerOpenTaskChat,
                object: nil,
                userInfo: ["task_id": taskId, "type": type]
            )
        }
    }
}
