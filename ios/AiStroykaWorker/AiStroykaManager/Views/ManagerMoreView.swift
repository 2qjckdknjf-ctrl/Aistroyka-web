//
//  ManagerMoreView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ManagerMoreView: View {
    @EnvironmentObject var sessionState: ManagerSessionState

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    Button("Sign out", role: .destructive) {
                        Task { await sessionState.signOut() }
                    }
                }
                Section("App") {
                    NavigationLink("Settings") {
                        ManagerSettingsView()
                    }
                    NavigationLink("Notifications") {
                        NotificationsPlaceholderView()
                    }
                }
            }
            .navigationTitle("More")
        }
    }
}
