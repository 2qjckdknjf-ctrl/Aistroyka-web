//
//  ManagerSettingsView.swift
//  AiStroyka Manager
//
//  Includes diagnostics for field debugging: version, env, tenant, role, auth state.
//

import SwiftUI
import Shared

struct ManagerSettingsView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @State private var meData: (tenantId: String?, role: String?)?
    @State private var meLoadFailed = false

    private var appVersion: String {
        (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "—"
    }
    private var buildNumber: String {
        (Bundle.main.infoDictionary?["CFBundleVersion"] as? String) ?? "—"
    }

    var body: some View {
        List {
            Section("Account") {
                Text(sessionState.isLoggedIn ? "Signed in" : "Not signed in")
                    .foregroundColor(sessionState.isLoggedIn ? .green : .secondary)
                if sessionState.isAuthorizedRole == false, let msg = sessionState.roleFailureMessage {
                    Text(msg).font(.caption).foregroundColor(.orange)
                }
            }
            Section("Environment") {
                LabeledContent("API", value: Config.baseURL)
                Text("Client: ios_manager").font(.caption).foregroundColor(.secondary)
            }
            Section("Diagnostics") {
                LabeledContent("App version", value: appVersion)
                LabeledContent("Build", value: buildNumber)
                LabeledContent("Tenant ID", value: meData?.tenantId ?? (meLoadFailed ? "—" : "…"))
                LabeledContent("Role", value: meData?.role ?? (meLoadFailed ? "—" : "…"))
            }
        }
        .navigationTitle("Settings")
        .task {
            guard sessionState.isLoggedIn else { return }
            do {
                let r = try await ManagerAPI.me()
                await MainActor.run {
                    meData = (r.data?.tenantId, r.data?.role)
                    meLoadFailed = false
                }
            } catch {
                await MainActor.run {
                    meData = nil
                    meLoadFailed = true
                }
            }
        }
    }
}
