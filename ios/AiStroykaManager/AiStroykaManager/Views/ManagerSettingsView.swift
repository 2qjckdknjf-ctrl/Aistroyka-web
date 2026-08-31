//
//  ManagerSettingsView.swift
//  AiStroyka Manager
//

import SwiftUI
import UIKit
import Shared

struct ManagerSettingsView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @State private var meData: (tenantId: String?, role: String?)?
    @State private var meLoadFailed = false
    @State private var workspaceName = ""
    @State private var isSavingWorkspace = false
    @State private var workspaceMessage: String?
    @State private var workspaceError: String?

    private var appVersion: String {
        (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "—"
    }
    private var buildNumber: String {
        (Bundle.main.infoDictionary?["CFBundleVersion"] as? String) ?? "—"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if sessionState.isLoggedIn {
                    ManagerV43Card {
                        Text(NSLocalizedString("mgr_v43_workspace", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        TextField(NSLocalizedString("mgr_v43_workspace_name", comment: ""), text: $workspaceName)
                            .foregroundStyle(ManagerV43.textPrimary)
                            .textInputAutocapitalization(.words)
                            .accessibilityIdentifier("pilot_manager_workspace_name")
                        if let workspaceError {
                            Text(workspaceError).font(.caption).foregroundStyle(ManagerV43.danger)
                        }
                        if let workspaceMessage {
                            Text(workspaceMessage).font(.caption).foregroundStyle(ManagerV43.success)
                        }
                        ManagerV43PrimaryButton(
                            title: NSLocalizedString("mgr_v43_save_workspace", comment: ""),
                            enabled: !workspaceName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSavingWorkspace,
                            loading: isSavingWorkspace,
                            action: saveWorkspace
                        )
                    }
                }

                ManagerV43Card {
                    Text(NSLocalizedString("mgr_section_account", comment: ""))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                    Text(sessionState.isLoggedIn ? NSLocalizedString("mgr_signed_in", comment: "") : NSLocalizedString("mgr_not_signed_in", comment: ""))
                        .foregroundStyle(sessionState.isLoggedIn ? ManagerV43.success : ManagerV43.textSecondary)
                    if sessionState.isAuthorizedRole == false, let msg = sessionState.roleFailureMessage {
                        Text(msg).font(.caption).foregroundStyle(ManagerV43.warning)
                    }
                }

                ManagerV43Card {
                    Text(NSLocalizedString("mgr_environment_section", comment: ""))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                    labeled(NSLocalizedString("mgr_api", comment: ""), Config.baseURL)
                    Text(NSLocalizedString("mgr_client_ios_manager", comment: ""))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                }

                ManagerV43Card {
                    Text(NSLocalizedString("mgr_diagnostics_section", comment: ""))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                    labeled(NSLocalizedString("mgr_app_version", comment: ""), appVersion)
                    labeled(NSLocalizedString("mgr_build", comment: ""), buildNumber)
                    labeled(NSLocalizedString("mgr_tenant_id", comment: ""), meData?.tenantId ?? (meLoadFailed ? "—" : "…"))
                    labeled(NSLocalizedString("mgr_role", comment: ""), meData?.role ?? (meLoadFailed ? "—" : "…"))
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        labeled(NSLocalizedString("mgr_v43_language", comment: ""), Locale.current.identifier)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(NSLocalizedString("mgr_v43_language", comment: ""))
                }

                if !sessionState.isLoggedIn {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_v43_permission_denied", comment: ""),
                        subtitle: NSLocalizedString("mgr_not_signed_in", comment: "")
                    )
                    .frame(minHeight: 140)
                }
            }
            .padding(ManagerV43.screenX)
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_settings", comment: ""))
        .task {
            guard sessionState.isLoggedIn else { return }
            do {
                let r = try await ManagerAPI.me()
                let profileName = await ManagerAPI.resolvedWorkspaceName()
                await MainActor.run {
                    meData = (r.data?.tenantId, r.data?.role)
                    if let profileName, !profileName.isEmpty {
                        workspaceName = profileName
                    }
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

    private func saveWorkspace() {
        let name = workspaceName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        Task {
            let success = await runManagerAction(
                setLoading: { isSavingWorkspace = $0 },
                setErrorMessage: { workspaceError = $0 }
            ) {
                let saved = try await ManagerAPI.updateTenantProfile(name: name)
                await MainActor.run {
                    if let saved { workspaceName = saved }
                    workspaceMessage = NSLocalizedString("mgr_v43_workspace_saved", comment: "")
                }
                ManagerLiveSync.post(ManagerLiveSync.workspaceChanged)
            }
            if success {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }
        }
    }

    private func labeled(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title).foregroundStyle(ManagerV43.textSecondary)
            Spacer()
            Text(value).foregroundStyle(ManagerV43.textPrimary).lineLimit(1)
        }
        .font(.subheadline)
    }
}
