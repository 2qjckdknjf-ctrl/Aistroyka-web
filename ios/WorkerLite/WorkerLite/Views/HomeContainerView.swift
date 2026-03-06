//
//  HomeContainerView.swift
//  WorkerLite
//

import SwiftUI

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
                ProgressView("Loading…")
            } else if let err = errorMessage {
                VStack {
                    Text(err).foregroundColor(.red)
                    Button("Retry") { loadProjects() }
                }
            } else if projects.isEmpty {
                Text("No projects").padding()
            } else if selectedProject == nil, projects.count == 1 {
                ProgressView()
                    .onAppear {
                        selectedProject = projects[0]
                        saveSelectedProjectId(projects[0].id)
                    }
            } else if selectedProject == nil {
                ProjectPickerView(projects: projects, selected: $selectedProject)
            } else {
                HomeView(project: selectedProject!, onLogout: { appState.logout() })
            }
        }
        .onAppear {
            loadProjects()
            restoreSelectedProject()
        }
        .onChange(of: selectedProject?.id) { _, new in
            if let id = new { saveSelectedProjectId(id) }
        }
    }
    
    private func restoreSelectedProject() {
        guard let id = store.state.selectedProjectId, !projects.isEmpty else { return }
        if let p = projects.first(where: { $0.id == id }) {
            selectedProject = p
        }
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
