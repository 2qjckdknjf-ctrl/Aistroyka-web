//
//  ProjectsListView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ProjectsListView: View {
    @State private var projects: [ProjectDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading projects…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let err = errorMessage {
                    VStack(spacing: 12) {
                        Text(err)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                        Button("Retry") { load() }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if projects.isEmpty {
                    Text("No projects yet")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(projects, id: \.id) { p in
                        NavigationLink(destination: ProjectDetailPlaceholderView(projectId: p.id, name: p.name ?? "Project")) {
                            Text(p.name ?? p.id)
                        }
                    }
                }
            }
            .navigationTitle("Projects")
            .onAppear { load() }
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task {
            do {
                projects = try await ManagerAPI.projects()
            } catch let e as APIError {
                errorMessage = e.message
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct ProjectDetailPlaceholderView: View {
    let projectId: String
    let name: String

    var body: some View {
        List {
            Text("Project: \(name)")
            Text("ID: \(projectId)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .navigationTitle(name)
    }
}
