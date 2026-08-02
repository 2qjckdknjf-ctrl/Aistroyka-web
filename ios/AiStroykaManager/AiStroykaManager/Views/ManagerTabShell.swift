//
//  ManagerTabShell.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ManagerTabShell: View {
    /// Phase 5 review launches with report id → land on Reports tab.
    @State private var selectedTab = ManagerUITestLaunchHooks.e2eReportId != nil ? 3 : 0

    var body: some View {
        // Phase 5 review UITests pass both project + report ids. Prefer the reports tab shell so
        // `pilot_manager_report_<id>` is reachable; project-only deeplink remains for smoke.
        if ManagerUITestLaunchHooks.e2eReportId != nil {
            managerTabs
                .accessibilityIdentifier("pilot_manager_e2e_reports_shell")
        } else if let projectId = ManagerUITestLaunchHooks.e2eProjectId {
            NavigationStack {
                ProjectDetailView(projectId: projectId, projectName: nil)
            }
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("pilot_manager_e2e_deeplink_shell")
        } else {
            managerTabs
        }
    }

    private var managerTabs: some View {
        TabView(selection: $selectedTab) {
            HomeDashboardView()
                .tabItem { Label(NSLocalizedString("mgr_tab_home", comment: ""), systemImage: "house.fill") }
                .tag(0)
            ProjectsListView()
                .accessibilityIdentifier("pilot_manager_projects_tab")
                .tabItem { Label(NSLocalizedString("mgr_tab_projects", comment: ""), systemImage: "folder.fill") }
                .tag(1)
            TasksListView()
                .tabItem { Label(NSLocalizedString("mgr_tab_tasks", comment: ""), systemImage: "checklist") }
                .tag(2)
            // Do not force project filter in E2E review — exact report id is the selection key.
            ReportsInboxView(initialProjectId: ManagerUITestLaunchHooks.e2eReportId == nil
                ? ManagerUITestLaunchHooks.e2eProjectId
                : nil)
                .tabItem { Label(NSLocalizedString("mgr_tab_reports", comment: ""), systemImage: "doc.text.fill") }
                .tag(3)
                .accessibilityIdentifier("pilot_manager_tab_reports")
            TeamOverviewView()
                .tabItem { Label(NSLocalizedString("mgr_tab_team", comment: ""), systemImage: "person.3.fill") }
                .tag(4)
            AITabView()
                .tabItem { Label(NSLocalizedString("mgr_tab_ai", comment: ""), systemImage: "sparkles") }
                .tag(5)
            ManagerMoreView()
                .tabItem { Label(NSLocalizedString("mgr_tab_more", comment: ""), systemImage: "ellipsis.circle.fill") }
                .tag(6)
        }
        .accessibilityIdentifier("pilot_manager_tab_shell")
        .tint(.accentColor)
    }
}
