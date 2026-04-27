//
//  ManagerSessionState.swift
//  AiStroyka Manager
//

import Foundation
import Shared

@MainActor
final class ManagerSessionState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var isAuthorizedRole = false
    @Published var roleFailureMessage: String?
    private var sessionCheckTask: Task<Void, Never>?

    func checkSession() {
        sessionCheckTask?.cancel()
        sessionCheckTask = Task { [weak self] in
            guard let self else { return }
            let session = await AuthService.shared.currentSession()
            guard !Task.isCancelled else { return }
            isLoggedIn = session != nil
            if isLoggedIn {
                await checkRole()
            } else {
                isAuthorizedRole = false
                roleFailureMessage = nil
            }
        }
    }

    /// Manager app allows owner, admin, member (foreman). Viewer or no tenant → unauthorized.
    private func checkRole() async {
        do {
            let r = try await ManagerAPI.me()
            guard let data = r.data else {
                isAuthorizedRole = false
                roleFailureMessage = NSLocalizedString("mgr_err_no_tenant_context", comment: "")
                return
            }
            guard let role = data.role?.lowercased(), !role.isEmpty else {
                isAuthorizedRole = false
                roleFailureMessage = NSLocalizedString("mgr_err_no_team_membership", comment: "")
                return
            }
            let allowed: Set<String> = ["owner", "admin", "member"]
            if allowed.contains(role) {
                isAuthorizedRole = true
                roleFailureMessage = nil
            } else {
                isAuthorizedRole = false
                let template = NSLocalizedString("mgr_err_role_not_allowed", comment: "")
                roleFailureMessage = String(format: template, role)
            }
        } catch let e as APIError {
            if e.statusCode == 401 {
                isAuthorizedRole = false
                roleFailureMessage = NSLocalizedString("mgr_err_session_expired", comment: "")
            } else {
                isAuthorizedRole = false
                roleFailureMessage = e.message
            }
        } catch {
            isAuthorizedRole = false
            roleFailureMessage = error.localizedDescription
        }
    }

    func signOut() async {
        sessionCheckTask?.cancel()
        await AuthService.shared.signOut()
        isLoggedIn = false
        isAuthorizedRole = false
        roleFailureMessage = nil
    }
}
