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
    
    private let auth: AuthService
    
    init(auth: AuthService = .shared) {
        self.auth = auth
    }
    
    func checkSession() {
        Task {
            let session = await auth.currentSession()
            isLoggedIn = session != nil
            currentUser = session?.user.email
        }
    }
    
    func logout() {
        Task {
            await auth.signOut()
            isLoggedIn = false
            currentUser = nil
        }
    }
}
