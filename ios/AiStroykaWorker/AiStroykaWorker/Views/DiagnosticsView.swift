//
//  DiagnosticsView.swift
//  AiStroykaWorker
//
//  Support/diagnostics for field debugging: version, env, device, auth, sync.
//

import SwiftUI

struct DiagnosticsView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var syncService = SyncService.shared

    private var appVersion: String {
        (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "—"
    }
    private var buildNumber: String {
        (Bundle.main.infoDictionary?["CFBundleVersion"] as? String) ?? "—"
    }

    var body: some View {
        List {
            Section("App") {
                LabeledContent("Version", value: appVersion)
                LabeledContent("Build", value: buildNumber)
            }
            Section("Environment") {
                LabeledContent("API", value: Config.baseURL)
                Text("Client: ios_lite").font(.caption).foregroundColor(.secondary)
            }
            Section("Device") {
                Text(DeviceContext.deviceId)
                    .font(.caption)
                    .lineLimit(2)
                    .textSelection(.enabled)
            }
            Section("Session") {
                Text(appState.isLoggedIn ? "Signed in" : "Not signed in")
                    .foregroundColor(appState.isLoggedIn ? .green : .secondary)
            }
            Section("Sync") {
                LabeledContent("Status", value: syncService.status.rawValue)
                if let err = syncService.lastError {
                    Text(err).font(.caption).foregroundColor(.orange).textSelection(.enabled)
                }
            }
        }
        .navigationTitle("Diagnostics")
    }
}
