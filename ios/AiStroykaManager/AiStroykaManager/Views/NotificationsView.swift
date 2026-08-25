//
//  NotificationsView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct NotificationsView: View {
    var onOpenTarget: ((_ targetType: String, _ targetId: String) -> Void)? = nil
    @EnvironmentObject var router: ManagerTabRouter

    @StateObject private var network = NetworkMonitor.shared
    @State private var items: [NotificationInboxItemDTO] = []
    @State private var total = 0
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var devices: [DeviceRowDTO] = []
    @State private var showDevices = false
    @State private var filter = "all"
    @State private var lastSync: Date?
    @State private var mutedIds: Set<String> = Set(UserDefaults.standard.stringArray(forKey: "mgr.v43.muted.notifications") ?? [])
    @State private var markingAll = false
    @State private var isLoadingMore = false
    @State private var canLoadMore = false

    private let cacheKey = "mgr.v43.notifications"

    var body: some View {
        Group {
            if isLoading && items.isEmpty && errorMessage == nil {
                ScrollView {
                    VStack(spacing: 12) {
                        ManagerSkeletonBlock(height: 48)
                        ManagerSkeletonBlock(height: 96)
                        ManagerSkeletonBlock(height: 96)
                    }
                    .padding(ManagerV43.screenX)
                }
            } else if let err = errorMessage, items.isEmpty {
                if ManagerV43Formatters.isPermissionDenied(err) {
                    EmptyStateView(title: NSLocalizedString("mgr_v43_permission_denied", comment: ""), subtitle: err)
                } else {
                    ErrorStateView(message: err, retry: { load() })
                }
            } else {
                content
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_notifications", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(NSLocalizedString("mgr_v43_read_all", comment: "")) { markAllRead() }
                    .disabled(markingAll || unread.isEmpty)
            }
        }
        .refreshable { await loadAsync() }
        .onAppear {
            if items.isEmpty, let cached = ManagerCacheStore.load([NotificationInboxItemDTO].self, key: cacheKey) {
                items = cached
                lastSync = ManagerCacheStore.lastSync(key: cacheKey)
            }
            loadIfNeeded()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.notificationsChanged)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
    }

    private var unread: [NotificationInboxItemDTO] {
        items.filter { $0.readAt == nil }
    }

    private var actionCount: Int {
        items.filter { ManagerV43Formatters.notificationNeedsAction(type: $0.type, readAt: $0.readAt) }.count
    }

    private var visible: [NotificationInboxItemDTO] {
        items.filter { item in
            guard !mutedIds.contains(item.id) else { return false }
            switch filter {
            case "action":
                return ManagerV43Formatters.notificationNeedsAction(type: item.type, readAt: item.readAt)
            case "updates":
                return !ManagerV43Formatters.notificationNeedsAction(type: item.type, readAt: item.readAt)
            default:
                return true
            }
        }
    }

    private var grouped: [(String, [NotificationInboxItemDTO])] {
        let order = ["today", "yesterday", "earlier"]
        let dict = Dictionary(grouping: visible) { ManagerV43Formatters.dayGroup(createdAt: $0.createdAt) }
        return order.compactMap { key in
            guard let rows = dict[key], !rows.isEmpty else { return nil }
            return (key, rows)
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if !network.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                }

                if total > 0 {
                    Text(String(format: NSLocalizedString("mgr_inbox_count_fmt", comment: ""), items.count, total))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                }

                HStack(spacing: 8) {
                    ManagerV43Chip(title: NSLocalizedString("mgr_all", comment: ""), selected: filter == "all") { filter = "all" }
                    ManagerV43Chip(
                        title: String(format: NSLocalizedString("mgr_v43_needs_action_fmt", comment: ""), actionCount),
                        selected: filter == "action"
                    ) { filter = "action" }
                    ManagerV43Chip(title: NSLocalizedString("mgr_v43_updates", comment: ""), selected: filter == "updates") { filter = "updates" }
                }

                if visible.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_inbox", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_notifications_subtitle", comment: "")
                    )
                    .frame(minHeight: 180)
                } else {
                    ForEach(grouped, id: \.0) { group, rows in
                        Text(dayTitle(group))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(ManagerV43.textSecondary)
                        ForEach(rows, id: \.id) { item in
                            NotificationCanonRow(
                                item: item,
                                onOpen: { openTarget(item) },
                                onDone: { markRead(item.id) },
                                onMute: { mute(item.id) }
                            )
                        }
                    }
                }

                if canLoadMore, !ManagerV43Preview.isEnabled {
                    Button {
                        loadMore()
                    } label: {
                        if isLoadingMore {
                            ProgressView()
                                .frame(maxWidth: .infinity, minHeight: ManagerV43.touch)
                        } else {
                            Text(NSLocalizedString("mgr_v43_load_more", comment: ""))
                                .frame(maxWidth: .infinity, minHeight: ManagerV43.touch)
                        }
                    }
                    .disabled(isLoadingMore)
                    .foregroundStyle(ManagerV43.dataBlue)
                    .accessibilityIdentifier("pilot_manager_notifications_load_more")
                }

                DisclosureGroup(NSLocalizedString("mgr_registered_devices", comment: ""), isExpanded: $showDevices) {
                    if devices.isEmpty {
                        Text(NSLocalizedString("mgr_no_devices_subtitle", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    } else {
                        ForEach(Array(devices.enumerated()), id: \.offset) { _, d in
                            HStack {
                                Text(d.deviceId ?? "—").font(.caption).foregroundStyle(ManagerV43.textPrimary)
                                Spacer()
                                Text(d.platform ?? "").font(.caption2).foregroundStyle(ManagerV43.textSecondary)
                            }
                        }
                    }
                }
                .foregroundStyle(ManagerV43.textPrimary)
                .onChange(of: showDevices) { expanded in
                    if expanded && devices.isEmpty { loadDevices() }
                }
            }
            .padding(.horizontal, ManagerV43.screenX)
            .padding(.bottom, 24)
        }
    }

    private func dayTitle(_ key: String) -> String {
        switch key {
        case "today": return NSLocalizedString("mgr_v43_today", comment: "")
        case "yesterday": return NSLocalizedString("mgr_v43_yesterday", comment: "")
        default: return NSLocalizedString("mgr_v43_earlier", comment: "")
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        if errorMessage != nil { return }
        load()
    }

    private func loadAsync() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await ManagerAPI.notifications(limit: 50, offset: 0)
            items = result.items
            total = result.total
            canLoadMore = result.items.count < result.total && !result.items.isEmpty
            ManagerCacheStore.save(result.items, key: cacheKey)
            lastSync = Date()
            router.notificationsBadge = items.filter { $0.readAt == nil }.count
        } catch {
            if ManagerV43Preview.showsCatalogWithoutAuth {
                items = ManagerDemoCatalog.notifications
                total = items.count
                canLoadMore = false
                router.notificationsBadge = items.filter { $0.readAt == nil }.count
                errorMessage = nil
            } else {
                errorMessage = localizedManagerError(error)
            }
        }
    }

    private func loadMore() {
        guard !isLoadingMore, canLoadMore else { return }
        isLoadingMore = true
        Task {
            defer { isLoadingMore = false }
            do {
                let result = try await ManagerAPI.notifications(limit: 50, offset: items.count)
                let existing = Set(items.map(\.id))
                let appended = result.items.filter { !existing.contains($0.id) }
                items.append(contentsOf: appended)
                total = result.total
                canLoadMore = !appended.isEmpty && items.count < total
            } catch {
                // Keep the loaded inbox; the button stays available to retry.
            }
        }
    }

    private func loadDevices() {
        Task {
            do { devices = try await ManagerAPI.devices(limit: 50) }
            catch { devices = [] }
        }
    }

    private func openTarget(_ item: NotificationInboxItemDTO) {
        if item.readAt == nil { markRead(item.id) }
        guard let type = item.targetType?.trimmingCharacters(in: .whitespacesAndNewlines),
              let id = item.targetId?.trimmingCharacters(in: .whitespacesAndNewlines),
              !type.isEmpty, !id.isEmpty else { return }
        onOpenTarget?(type, id)
    }

    private func markRead(_ id: String) {
        Task {
            try? await ManagerAPI.markNotificationRead(id: id)
            ManagerLiveSync.post(ManagerLiveSync.notificationsChanged)
            await loadAsync()
        }
    }

    private func markAllRead() {
        guard !markingAll else { return }
        markingAll = true
        Task {
            try? await ManagerAPI.markAllNotificationsRead()
            ManagerLiveSync.post(ManagerLiveSync.notificationsChanged)
            await loadAsync()
            markingAll = false
        }
    }

    private func mute(_ id: String) {
        mutedIds.insert(id)
        UserDefaults.standard.set(Array(mutedIds), forKey: "mgr.v43.muted.notifications")
    }
}

struct NotificationCanonRow: View {
    let item: NotificationInboxItemDTO
    let onOpen: () -> Void
    let onDone: () -> Void
    let onMute: () -> Void

    var body: some View {
        ManagerV43Card(borderColor: needsAction ? ManagerV43.danger.opacity(0.55) : ManagerV43.border) {
            HStack(alignment: .top, spacing: 10) {
                Circle()
                    .fill(dotColor)
                    .frame(width: 10, height: 10)
                    .padding(.top, 6)
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(item.title ?? NSLocalizedString("mgr_notification", comment: ""))
                            .font(.system(size: 16, weight: item.readAt == nil ? .semibold : .regular))
                            .foregroundStyle(ManagerV43.textPrimary)
                        Spacer()
                        if let created = ManagerV43Formatters.parseISODate(item.createdAt) {
                            Text(ManagerV43Formatters.relativeTime(created))
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                    }
                    if let body = item.body, !body.isEmpty {
                        Text(body)
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                            .lineLimit(3)
                    }
                    HStack {
                        if let type = item.targetType, !type.isEmpty {
                            Label(type, systemImage: "building.2")
                                .font(.caption2)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                        Spacer()
                        if needsAction {
                            Button(NSLocalizedString("mgr_v43_review", comment: ""), action: onOpen)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(ManagerV43.yellowInk)
                                .padding(.horizontal, 10)
                                .frame(minHeight: 36)
                                .background(ManagerV43.yellow)
                                .clipShape(Capsule())
                        }
                        Button(NSLocalizedString("mgr_v43_mark_read", comment: ""), action: onDone)
                            .font(.caption)
                            .foregroundStyle(ManagerV43.dataBlue)
                            .frame(minHeight: 36)
                        if ManagerV43Preview.isEnabled {
                            Button(NSLocalizedString("mgr_v43_mute", comment: ""), action: onMute)
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                                .frame(minHeight: 36)
                        }
                    }
                }
            }
        }
        .onTapGesture(perform: onOpen)
        .accessibilityHint(NSLocalizedString("mgr_v43_review", comment: ""))
    }

    private var needsAction: Bool {
        ManagerV43Formatters.notificationNeedsAction(type: item.type, readAt: item.readAt)
    }

    private var dotColor: Color {
        if needsAction { return ManagerV43.danger }
        if (item.type ?? "").localizedCaseInsensitiveContains("ai") { return ManagerV43.aiViolet }
        if item.readAt == nil { return ManagerV43.dataBlue }
        return ManagerV43.border
    }
}

struct NotificationRowView: View {
    let item: NotificationInboxItemDTO
    let onTap: () -> Void
    let onMarkRead: () -> Void

    var body: some View {
        NotificationCanonRow(item: item, onOpen: onTap, onDone: onMarkRead, onMute: {})
    }
}
