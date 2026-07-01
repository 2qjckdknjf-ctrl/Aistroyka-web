//
//  ManagerMoreView.swift
//  AiStroyka Manager
//
//  Uses path-based navigation so Notifications can push task/report/project detail and preserve tab state.
//

import SwiftUI
import Shared

/// Lightweight destination for More-tab stack (settings, notifications, then task/report/project detail).
enum ManagerMoreDestination: Hashable {
    case settings
    case notifications
    case task(id: String)
    case report(id: String)
    case project(id: String)
}

struct ManagerMoreView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @State private var path: [ManagerMoreDestination] = []

    var body: some View {
        NavigationStack(path: $path) {
            List {
                Section("Account") {
                    Button("Sign out", role: .destructive) {
                        Task { await sessionState.signOut() }
                    }
                }
                Section("App") {
                    NavigationLink("Settings", value: ManagerMoreDestination.settings)
                    NavigationLink("Notifications", value: ManagerMoreDestination.notifications)
                }
            }
            .navigationTitle("More")
            .navigationDestination(for: ManagerMoreDestination.self) { dest in
                switch dest {
                case .settings:
                    ManagerSettingsView()
                case .notifications:
                    NotificationsView(onOpenTarget: { targetType, targetId in
                        let t = targetType.lowercased()
                        if t == "task" { path.append(.task(id: targetId)) }
                        else if t == "report" { path.append(.report(id: targetId)) }
                        else if t == "project" { path.append(.project(id: targetId)) }
                    })
                case .task(let id):
                    TaskDetailManagerView(taskId: id)
                case .report(let id):
                    ReportDetailReviewView(reportId: id)
                case .project(let id):
                    ProjectDetailView(projectId: id, projectName: nil)
                }
            }
        }
    }
}
