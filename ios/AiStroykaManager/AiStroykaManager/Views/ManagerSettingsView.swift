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
            Section(NSLocalizedString("mgr_section_account", comment: "")) {
                Text(sessionState.isLoggedIn ? NSLocalizedString("mgr_signed_in", comment: "") : NSLocalizedString("mgr_not_signed_in", comment: ""))
                    .foregroundColor(sessionState.isLoggedIn ? .green : .secondary)
                if sessionState.isAuthorizedRole == false, let msg = sessionState.roleFailureMessage {
                    Text(msg).font(.caption).foregroundColor(.orange)
                }
            }
            Section(NSLocalizedString("mgr_environment_section", comment: "")) {
                LabeledContent(NSLocalizedString("mgr_api", comment: ""), value: Config.baseURL)
                Text(NSLocalizedString("mgr_client_ios_manager", comment: "")).font(.caption).foregroundColor(.secondary)
            }
            Section(NSLocalizedString("mgr_diagnostics_section", comment: "")) {
                LabeledContent(NSLocalizedString("mgr_app_version", comment: ""), value: appVersion)
                LabeledContent(NSLocalizedString("mgr_build", comment: ""), value: buildNumber)
                LabeledContent(NSLocalizedString("mgr_tenant_id", comment: ""), value: meData?.tenantId ?? (meLoadFailed ? "—" : "…"))
                LabeledContent(NSLocalizedString("mgr_role", comment: ""), value: meData?.role ?? (meLoadFailed ? "—" : "…"))
            }
        }
        .aistroykaListChrome(
            pageBackground: ManagerSemanticColors.pageBackground,
            surfaceMuted: ManagerSemanticColors.surfaceMuted
        )
        .navigationTitle(NSLocalizedString("mgr_settings", comment: ""))
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
