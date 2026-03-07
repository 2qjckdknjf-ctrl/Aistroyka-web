//
//  ManagerSessionState.swift
//  AiStroyka Manager
//

import Foundation

@MainActor
final class ManagerSessionState: ObservableObject {
    @Published var isLoggedIn = false
    @Published var isAuthorizedRole = false
    @Published var roleFailureMessage: String?

    func checkSession() {
        Task {
            let session = await AuthService.shared.currentSession()
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
                roleFailureMessage = "No tenant context."
                return
            }
            guard let role = data.role?.lowercased(), !role.isEmpty else {
                isAuthorizedRole = false
                roleFailureMessage = "You are not a member of any team."
                return
            }
            let allowed: Set<String> = ["owner", "admin", "member"]
            if allowed.contains(role) {
                isAuthorizedRole = true
                roleFailureMessage = nil
            } else {
                isAuthorizedRole = false
                roleFailureMessage = "Manager app is for owners, admins, and team leads. Your role (\(role)) does not have access."
            }
        } catch let e as APIError {
            if e.statusCode == 401 {
                isAuthorizedRole = false
                roleFailureMessage = "Session expired. Please sign in again."
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
        await AuthService.shared.signOut()
        isLoggedIn = false
        isAuthorizedRole = false
        roleFailureMessage = nil
    }
}
