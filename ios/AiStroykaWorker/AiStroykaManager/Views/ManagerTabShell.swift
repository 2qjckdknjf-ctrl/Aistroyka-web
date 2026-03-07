//
//  ManagerTabShell.swift
//  AiStroyka Manager
//

import SwiftUI

struct ManagerTabShell: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeDashboardView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            ProjectsListView()
                .tabItem { Label("Projects", systemImage: "folder.fill") }
                .tag(1)
            TasksListView()
                .tabItem { Label("Tasks", systemImage: "checklist") }
                .tag(2)
            ReportsInboxView()
                .tabItem { Label("Reports", systemImage: "doc.text.fill") }
                .tag(3)
            TeamOverviewView()
                .tabItem { Label("Team", systemImage: "person.3.fill") }
                .tag(4)
            AITabView()
                .tabItem { Label("AI", systemImage: "sparkles") }
                .tag(5)
            ManagerMoreView()
                .tabItem { Label("More", systemImage: "ellipsis.circle.fill") }
                .tag(6)
        }
        .tint(.accentColor)
    }
}
