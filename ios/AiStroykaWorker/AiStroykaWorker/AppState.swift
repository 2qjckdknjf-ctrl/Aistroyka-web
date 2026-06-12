//
//  AppState.swift
//  AiStroykaWorker
//

import Foundation
import SwiftUI
import Shared

@MainActor
final class AppState: ObservableObject {
    @Published var isLoggedIn: Bool = false
    @Published var currentUser: String?
    /// Shown on LoginView when live E2E bootstrap sign-in fails (UITest reads `pilot_worker_login_error`).
    @Published var bootstrapAuthError: String?
    /// Live E2E: block home until programmatic sign-in finishes.
    @Published var isE2EBootstrapping = false

    private let auth: AuthService
    
    init(auth: AuthService = .shared) {
        self.auth = auth
    }
    
    func checkSession() {
        Task { await refreshSessionState() }
    }

    /// Live E2E: wait until Supabase session is visible to SwiftUI after programmatic sign-in.
    func checkSessionAndWait(maxAttempts: Int = 40) async {
        bootstrapAuthError = nil
        for _ in 0..<maxAttempts {
            await refreshSessionState()
            if isLoggedIn { return }
            try? await Task.sleep(nanoseconds: 500_000_000)
        }
    }

    private func refreshSessionState() async {
        let session = await auth.currentSession()
        isLoggedIn = session != nil
        currentUser = session?.user.email
    }
    
    func logout() {
        Task {
            if await auth.currentSession() != nil {
                try? await WorkerAPI.unregisterDevice()
            }
            await auth.signOut()
            isLoggedIn = false
            currentUser = nil
        }
    }
}
