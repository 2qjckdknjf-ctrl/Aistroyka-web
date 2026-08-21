//
//  NotificationsView.swift
//  AiStroyka Manager
//
//  Manager inbox: GET /api/v1/notifications. Navigate to task/report by target_type/target_id; mark read.
//

import SwiftUI
import Shared

struct NotificationsView: View {
    /// When provided (e.g. from More tab), tapping a notification with target_type/target_id navigates to task/report/project.
    var onOpenTarget: ((_ targetType: String, _ targetId: String) -> Void)? = nil

    @State private var items: [NotificationInboxItemDTO] = []
    @State private var total = 0
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var devices: [DeviceRowDTO] = []
    @State private var showDevices = false

    var body: some View {
        Group {
            if isLoading && items.isEmpty && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading", comment: ""))
            } else if let err = errorMessage, items.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if items.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_inbox", comment: ""),
                    subtitle: NSLocalizedString("mgr_no_notifications_subtitle", comment: "")
                )
            } else {
                List {
                    Section {
                        ForEach(items, id: \.id) { item in
                            NotificationRowView(
                                item: item,
                                onTap: { openTarget(item) },
                                onMarkRead: { markRead(item.id) }
                            )
                        }
                    } header: {
                        if total > 0 {
                            Text(String(format: NSLocalizedString("mgr_inbox_count_fmt", comment: ""), items.count, total))
                        } else {
                            Text(NSLocalizedString("mgr_inbox", comment: ""))
                        }
                    }
                    .aistroykaRowChrome()
                    Section {
                        DisclosureGroup(NSLocalizedString("mgr_registered_devices", comment: ""), isExpanded: $showDevices) {
                            if devices.isEmpty && !showDevices { } else if devices.isEmpty {
                                Text(NSLocalizedString("mgr_no_devices_subtitle", comment: ""))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(Array(devices.enumerated()), id: \.offset) { _, d in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(d.deviceId ?? "—")
                                                .font(.caption)
                                            Text(d.platform ?? "")
                                                .font(.caption2)
                                                .foregroundStyle(.tertiary)
                                        }
                                        Spacer()
                                        if let c = d.createdAt {
                                            Text(shortDate(c))
                                                .font(.caption2)
                                                .foregroundStyle(.tertiary)
                                        }
                                    }
                                }
                            }
                        }
                        .onChange(of: showDevices) { expanded in
                            if expanded && devices.isEmpty { loadDevices() }
                        }
                    }
                    .aistroykaRowChrome()
                }
                .aistroykaListChrome(
                    pageBackground: ManagerSemanticColors.pageBackground,
                    surfaceMuted: ManagerSemanticColors.surfaceMuted
                )
            }
        }
        .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
        .navigationTitle(NSLocalizedString("mgr_notifications", comment: ""))
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: items, errorMessage: errorMessage) else { return }
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
        } catch let apiError as APIError {
            errorMessage = apiError.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadDevices() {
        Task {
            do {
                devices = try await ManagerAPI.devices(limit: 50)
            } catch {
                devices = []
            }
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
            await loadAsync()
        }
    }

    private func shortDate(_ s: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) ?? ISO8601DateFormatter().date(from: String(s.prefix(19)) + "Z") {
            return d.formatted(date: .abbreviated, time: .omitted)
        }
        return String(s.prefix(10))
    }
}

struct NotificationRowView: View {
    let item: NotificationInboxItemDTO
    let onTap: () -> Void
    let onMarkRead: () -> Void

    var body: some View {
        Button(action: {
            onTap()
        }) {
            HStack(alignment: .top, spacing: 10) {
                Circle()
                    .fill(item.readAt == nil ? Color.accentColor : Color.clear)
                    .frame(width: 8, height: 8)
                    .overlay(Circle().stroke(Color.accentColor.opacity(0.5), lineWidth: 1))
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title ?? NSLocalizedString("mgr_notification", comment: ""))
                        .font(.subheadline)
                        .fontWeight(item.readAt == nil ? .medium : .regular)
                        .foregroundStyle(.primary)
                    if let body = item.body, !body.isEmpty {
                        Text(body)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    if let created = item.createdAt {
                        Text(shortDate(created))
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }

    private func shortDate(_ s: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) ?? ISO8601DateFormatter().date(from: String(s.prefix(19)) + "Z") {
            return d.formatted(date: .abbreviated, time: .shortened)
        }
        return String(s.prefix(16))
    }
}
