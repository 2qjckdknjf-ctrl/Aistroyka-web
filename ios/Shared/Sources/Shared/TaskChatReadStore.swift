//
//  TaskChatReadStore.swift
//  Shared
//
//  Local last-read watermark per task for unread badges.
//

import Foundation

public enum TaskChatReadStore {
    private static let key = "aistroyka.taskChat.lastReadAt"

    public static func lastReadAt(taskId: String) -> String? {
        let map = load()
        return map[taskId]
    }

    public static func markRead(taskId: String, createdAt: String) {
        var map = load()
        if let prev = map[taskId], prev >= createdAt { return }
        map[taskId] = createdAt
        UserDefaults.standard.set(map, forKey: key)
    }

    public static func isUnread(taskId: String, latestCreatedAt: String?) -> Bool {
        guard let latest = latestCreatedAt, !latest.isEmpty else { return false }
        guard let last = lastReadAt(taskId: taskId) else { return true }
        return latest > last
    }

    private static func load() -> [String: String] {
        (UserDefaults.standard.dictionary(forKey: key) as? [String: String]) ?? [:]
    }
}
