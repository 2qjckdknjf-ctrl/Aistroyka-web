//
//  NotificationsView.swift
//  AiStroyka Manager
//
//  Manager inbox: GET /api/v1/notifications. Navigate to task/report by target_type/target_id; mark read.
//

import SwiftUI

struct NotificationsView: View {
    @State private var items: [NotificationInboxItemDTO] = []
    @State private var total = 0
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var devices: [DeviceRowDTO] = []
    @State private var showDevices = false

    var body: some View {
        Group {
            if isLoading && items.isEmpty && errorMessage == nil {
                LoadingStateView(message: "Loading…")
            } else if let err = errorMessage, items.isEmpty {
                VStack(spacing: 12) {
                    Text("Notifications")
                        .font(.headline)
                    Text(err)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
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
                            Text("Inbox (\(items.count) of \(total))")
                        } else {
                            Text("Inbox")
                        }
                    }
                    if items.isEmpty && !isLoading {
                        Text("No notifications yet. You’ll see report and task updates here.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .listRowBackground(Color.clear)
                    }
                    Section {
                        DisclosureGroup("Registered devices", isExpanded: $showDevices) {
                            if devices.isEmpty && !showDevices { } else if devices.isEmpty {
                                Text("No devices or API unavailable.")
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
                        .onChange(of: showDevices) { _, expanded in
                            if expanded && devices.isEmpty { loadDevices() }
                        }
                    }
                }
            }
        }
        .navigationTitle("Notifications")
        .refreshable { await loadAsync() }
        .onAppear { load() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadAsync() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await ManagerAPI.notifications(limit: 50, offset: 0)
            items = result.items
            total = result.total
        } catch let e as APIError {
            errorMessage = e.message
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
        guard let type = item.targetType?.lowercased(), let id = item.targetId, !id.isEmpty else { return }
        if item.readAt == nil { markRead(item.id) }
        // Navigation is handled by parent (tab/stack). We don't have NavigationPath here; document deep link in docs.
        // For now we only mark read; actual navigation would require coordinator or environment destination.
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
            onMarkRead()
        }) {
            HStack(alignment: .top, spacing: 10) {
                Circle()
                    .fill(item.readAt == nil ? Color.accentColor : Color.clear)
                    .frame(width: 8, height: 8)
                    .overlay(Circle().stroke(Color.accentColor.opacity(0.5), lineWidth: 1))
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title ?? "Notification")
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
