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

    /// Manager app allows owner, admin, member (foreman), or explicit manager role. Fails gracefully if not.
    private func checkRole() async {
        // TODO: Backend may expose role via GET /api/v1/me or tenant context; for now allow any logged-in user and gate on 403
        isAuthorizedRole = true
        roleFailureMessage = nil
    }

    func signOut() async {
        await AuthService.shared.signOut()
        isLoggedIn = false
        isAuthorizedRole = false
        roleFailureMessage = nil
    }
}
