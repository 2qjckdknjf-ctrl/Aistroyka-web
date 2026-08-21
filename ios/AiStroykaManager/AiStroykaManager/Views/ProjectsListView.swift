//
//  ProjectsListView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ProjectsListView: View {
    @State private var projects: [ProjectDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && projects.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_projects", comment: ""))
                        .accessibilityIdentifier("pilot_manager_projects_loading")
                } else if let err = errorMessage, projects.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if projects.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_projects_yet", comment: ""),
                        subtitle: nil
                    )
                    .accessibilityIdentifier("pilot_manager_projects_empty")
                } else {
                    List(projects, id: \.id) { p in
                        NavigationLink(destination: ProjectDetailView(projectId: p.id, projectName: p.name)) {
                            Text(p.name ?? p.id)
                                .accessibilityIdentifier("pilot_manager_project_\(p.id)")
                        }
                        .aistroykaRowChrome()
                    }
                    .aistroykaListChrome(
                        pageBackground: ManagerSemanticColors.pageBackground,
                        surfaceMuted: ManagerSemanticColors.surfaceMuted
                    )
                    .accessibilityIdentifier("pilot_manager_projects_list")
                }
            }
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("mgr_tab_projects", comment: ""))
            .refreshable { await loadAsync() }
            .onAppear { loadIfNeeded() }
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: projects, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            projects = try await ManagerAPI.projects()
        }
    }
}

struct ProjectDetailPlaceholderView: View {
    let projectId: String
    let name: String

    var body: some View {
        List {
            Text(String(format: NSLocalizedString("mgr_project_fmt", comment: ""), name))
                .aistroykaRowChrome()
            Text(String(format: NSLocalizedString("mgr_id_fmt", comment: ""), projectId))
                .font(.caption)
                .foregroundStyle(.secondary)
                .aistroykaRowChrome()
        }
        .aistroykaListChrome(
            pageBackground: ManagerSemanticColors.pageBackground,
            surfaceMuted: ManagerSemanticColors.surfaceMuted
        )
        .navigationTitle(name)
    }
}
