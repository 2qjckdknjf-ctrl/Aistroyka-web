//
//  NotificationsView.swift
//  AiStroyka Manager
//
//  Notification center: shows registered devices if GET /api/v1/devices is available;
//  otherwise empty state. No notifications inbox API yet.
//

import SwiftUI

struct NotificationsView: View {
    @State private var devices: [DeviceRowDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && devices.isEmpty && errorMessage == nil {
                LoadingStateView(message: "Loading…")
            } else if let err = errorMessage, devices.isEmpty {
                VStack(spacing: 12) {
                    Text("Notification center")
                        .font(.headline)
                    Text("No notification inbox is available yet. When the backend supports it, alerts will appear here.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Text("Devices: \(err)")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if devices.isEmpty {
                EmptyStateView(
                    title: "No notifications yet",
                    subtitle: "Notification inbox is not yet available. Registered devices can be listed when the API is enabled."
                )
            } else {
                List {
                    Section("Registered devices") {
                        Text("\(devices.count) device(s) registered for push. Tokens are not shown.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        ForEach(Array(devices.enumerated()), id: \.offset) { _, d in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(d.deviceId ?? "—")
                                        .font(.subheadline)
                                    Text(d.platform ?? "")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
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
            devices = try await ManagerAPI.devices(limit: 100)
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
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
