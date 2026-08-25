//
//  ManagerTabShell.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerTabShell: View {
    @StateObject private var router = ManagerTabRouter()
    @State private var visited: Set<ManagerTab> = [.home]
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if let projectId = ManagerUITestLaunchHooks.e2eProjectId {
                NavigationStack {
                    ProjectDetailView(projectId: projectId, projectName: nil)
                }
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("pilot_manager_e2e_deeplink_shell")
            } else {
                managerTabs
            }
        }
        .environmentObject(router)
        .tint(ManagerV43.yellow)
        .preferredColorScheme(.dark)
    }

    private var managerTabs: some View {
        VStack(spacing: 0) {
            ZStack {
                if visited.contains(.home) {
                    tabPage(HomeDashboardView(), .home)
                }
                if visited.contains(.projects) {
                    tabPage(ProjectsListView(), .projects)
                        .accessibilityIdentifier("pilot_manager_projects_tab")
                }
                if visited.contains(.tasks) {
                    tabPage(TasksListView(), .tasks)
                }
                if visited.contains(.ai) {
                    tabPage(AITabView(), .ai)
                }
                if visited.contains(.more) {
                    tabPage(ManagerMoreView(), .more)
                }
            }
            ManagerV43TabBar(selection: $router.selectedTab, tasksBadge: router.tasksBadge)
                .padding(.horizontal, 10)
                .padding(.bottom, 4)
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .onChange(of: router.selectedTab) { tab in
            visited.insert(tab)
        }
        .onReceive(NotificationCenter.default.publisher(for: .aiStroykaManagerOpenTaskChat)) { _ in
            router.selectedTab = .tasks
            visited.insert(.tasks)
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active {
                ManagerLiveSync.post(ManagerLiveSync.appBecameActive)
            }
        }
    }

    private func tabPage<Content: View>(_ content: Content, _ tab: ManagerTab) -> some View {
        content
            .opacity(router.selectedTab == tab ? 1 : 0)
            .zIndex(router.selectedTab == tab ? 1 : 0)
            .allowsHitTesting(router.selectedTab == tab)
            .accessibilityHidden(router.selectedTab != tab)
    }
}

extension Notification.Name {
    static let aiStroykaManagerOpenTaskChat = Notification.Name("AiStroykaManagerOpenTaskChat")
}
