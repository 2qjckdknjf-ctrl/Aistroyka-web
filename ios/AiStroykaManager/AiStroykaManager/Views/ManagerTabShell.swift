//
//  ManagerTabShell.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerTabShell: View {
    @StateObject private var router = ManagerTabRouter()
    @State private var visited: Set<ManagerTab> = [.home]
    @State private var presentedInbox: ManagerInboxSheet?
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
                if visited.contains(.home) || router.selectedTab == .home {
                    tabPage(HomeDashboardView(), .home)
                }
                if visited.contains(.projects) || router.selectedTab == .projects {
                    tabPage(ProjectsListView(), .projects)
                        .accessibilityIdentifier("pilot_manager_projects_tab")
                }
                if visited.contains(.tasks) || router.selectedTab == .tasks {
                    tabPage(TasksListView(), .tasks)
                }
                if visited.contains(.ai) || router.selectedTab == .ai {
                    tabPage(AITabView(), .ai)
                }
                if visited.contains(.more) || router.selectedTab == .more {
                    tabPage(ManagerMoreView(), .more)
                }
            }
            ManagerV43TabBar(selection: $router.selectedTab, tasksBadge: router.tasksBadge)
                .padding(.horizontal, 10)
                .padding(.bottom, 4)
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .sheet(item: $presentedInbox, onDismiss: { router.inboxSheet = nil }) { sheet in
            NavigationStack {
                switch sheet {
                case .notifications:
                    NotificationsView(onOpenTarget: { type, id, projectId in
                        presentedInbox = nil
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            router.routeNotification(type: type, id: id, projectId: projectId)
                        }
                    })
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button(NSLocalizedString("mgr_close", comment: "")) {
                                    presentedInbox = nil
                                }
                                .accessibilityIdentifier("pilot_manager_inbox_close")
                            }
                        }
                case .reports:
                    ReportsInboxView()
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button(NSLocalizedString("mgr_close", comment: "")) {
                                    presentedInbox = nil
                                }
                                .accessibilityIdentifier("pilot_manager_inbox_close")
                            }
                        }
                case .team:
                    TeamOverviewView()
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button(NSLocalizedString("mgr_close", comment: "")) {
                                    presentedInbox = nil
                                }
                                .accessibilityIdentifier("pilot_manager_inbox_close")
                            }
                        }
                }
            }
            .environmentObject(router)
            .preferredColorScheme(.dark)
            .tint(ManagerV43.yellow)
        }
        .onChange(of: router.inboxSheet) { value in
            presentedInbox = value
        }
        .onReceive(NotificationCenter.default.publisher(for: .aiStroykaManagerOpenNotifications)) { _ in
            presentedInbox = .notifications
        }
        .onReceive(NotificationCenter.default.publisher(for: .aiStroykaManagerOpenReports)) { _ in
            presentedInbox = .reports
        }
        .onReceive(NotificationCenter.default.publisher(for: .aiStroykaManagerOpenTeam)) { _ in
            presentedInbox = .team
        }
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
            .disabled(router.selectedTab != tab)
            .accessibilityHidden(router.selectedTab != tab)
    }
}

extension Notification.Name {
    static let aiStroykaManagerOpenTaskChat = Notification.Name("AiStroykaManagerOpenTaskChat")
    static let aiStroykaManagerOpenNotifications = Notification.Name("AiStroykaManagerOpenNotifications")
    static let aiStroykaManagerOpenReports = Notification.Name("AiStroykaManagerOpenReports")
    static let aiStroykaManagerOpenTeam = Notification.Name("AiStroykaManagerOpenTeam")
}
