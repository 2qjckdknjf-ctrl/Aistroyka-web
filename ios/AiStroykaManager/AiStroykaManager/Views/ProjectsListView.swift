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
                if isLoading {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_projects", comment: ""))
                } else if let err = errorMessage {
                    ErrorStateView(message: err, retry: { load() })
                } else if projects.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_projects_yet", comment: ""),
                        subtitle: nil
                    )
                } else {
                    List(projects, id: \.id) { p in
                        NavigationLink(destination: ProjectDetailView(projectId: p.id, projectName: p.name)) {
                            Text(p.name ?? p.id)
                        }
                    }
                }
            }
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
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
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
            Text(String(format: NSLocalizedString("mgr_id_fmt", comment: ""), projectId))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .navigationTitle(name)
    }
}
