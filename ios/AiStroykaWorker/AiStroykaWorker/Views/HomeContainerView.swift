//
//  HomeContainerView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct HomeContainerView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject private var store = AppStateStoreManager.shared
    @State private var selectedProject: ProjectDTO?
    @State private var projects: [ProjectDTO] = []
    @State private var loading = true
    @State private var errorMessage: String?
    
    var body: some View {
        Group {
            if loading && projects.isEmpty {
                InlineLoadingRow(NSLocalizedString("worker_loading_projects", comment: ""))
                    .accessibilityIdentifier("pilot_worker_projects_loading")
            } else if let err = errorMessage {
                InlineErrorRetryRow(
                    message: err,
                    retryTitle: NSLocalizedString("worker_retry", comment: "")
                ) { loadProjects() }
            } else if projects.isEmpty {
                VStack(spacing: 8) {
                    Text(NSLocalizedString("worker_no_projects", comment: ""))
                    Text(NSLocalizedString("worker_no_projects_subtitle", comment: ""))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
            } else if selectedProject == nil, projects.count == 1 {
                ProgressView()
                    .onAppear {
                        selectedProject = projects[0]
                        saveSelectedProjectId(projects[0].id)
                    }
            } else if selectedProject == nil {
                ProjectPickerView(projects: projects, selected: $selectedProject)
            } else {
                HomeView(
                    project: selectedProject!,
                    onLogout: { appState.logout() },
                    onLeaveProject: {
                        selectedProject = nil
                        store.save { $0.selectedProjectId = nil }
                    }
                )
                .accessibilityIdentifier("pilot_worker_home")
            }
        }
        .accessibilityIdentifier("pilot_worker_home_container")
        .onAppear {
            loadProjects()
            restoreSelectedProject()
            applyE2EProjectSelectionIfNeeded()
        }
        .onChange(of: selectedProject?.id) { new in
            if let id = new { saveSelectedProjectId(id) }
        }
    }
    
    private func restoreSelectedProject() {
        if applyE2EProjectSelectionIfNeeded() { return }
        guard let id = store.state.selectedProjectId, !projects.isEmpty else { return }
        if let p = projects.first(where: { $0.id == id }) {
            selectedProject = p
        }
    }

    @discardableResult
    private func applyE2EProjectSelectionIfNeeded() -> Bool {
        guard let e2eId = UITestLaunchHooks.e2eProjectId, !projects.isEmpty else { return false }
        guard let p = projects.first(where: { $0.id == e2eId }) else { return false }
        selectedProject = p
        saveSelectedProjectId(p.id)
        return true
    }
    
    private func saveSelectedProjectId(_ id: String) {
        store.save { $0.selectedProjectId = id }
    }
    
    private func loadProjects() {
        errorMessage = nil
        loading = true
        Task {
            do {
                let list = try await WorkerAPI.projects()
                await MainActor.run {
                    projects = list
                    if selectedProject == nil {
                        if applyE2EProjectSelectionIfNeeded() {
                            loading = false
                            return
                        }
                        if let id = store.state.selectedProjectId, let p = list.first(where: { $0.id == id }) {
                            selectedProject = p
                        } else if list.count == 1 {
                            selectedProject = list[0]
                            saveSelectedProjectId(list[0].id)
                        }
                    }
                    loading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = (error as? APIError)?.message ?? error.localizedDescription
                    loading = false
                }
            }
        }
    }
}
