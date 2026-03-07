//
//  TasksListView.swift
//  AiStroyka Manager
//

import SwiftUI

struct TasksListView: View {
    @State private var tasks: [TaskDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var statusFilter: String?
    @State private var showCreate = false
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && tasks.isEmpty && errorMessage == nil {
                    LoadingStateView(message: "Loading tasks…")
                } else if let err = errorMessage, tasks.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if tasks.isEmpty {
                    EmptyStateView(title: "No tasks", subtitle: "Create a task or change filters.")
                        .overlay(alignment: .bottom) {
                            createButton
                        }
                } else {
                    listContent
                }
            }
            .navigationTitle("Tasks")
            .toolbar { ToolbarItem(placement: .primaryAction) { Button("New", systemImage: "plus") { showCreate = true } } }
            .refreshable { await loadAsync() }
            .onAppear { load() }
            .sheet(isPresented: $showCreate) {
                if let proj = projects.first ?? projects.first(where: { $0.id == selectedProjectId }) {
                    TaskCreateEditView(projectId: proj.id, projectName: proj.name, onDismiss: { showCreate = false; load() })
                } else {
                    Text("Load projects first")
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { showCreate = false } } }
                }
            }
        }
    }

    private var listContent: some View {
        VStack(spacing: 0) {
            filtersBar
            List(tasks, id: \.id) { t in
                NavigationLink(destination: TaskDetailManagerView(taskId: t.id)) {
                    TaskRowView(task: t)
                }
            }
        }
    }

    private var filtersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: "All projects", selected: selectedProjectId == nil) { selectedProjectId = nil; load() }
                ForEach(projects.prefix(5), id: \.id) { p in
                    FilterChip(title: p.name ?? p.id, selected: selectedProjectId == p.id) {
                        selectedProjectId = p.id
                        load()
                    }
                }
                FilterChip(title: "All status", selected: statusFilter == nil) { statusFilter = nil; load() }
                FilterChip(title: "Pending", selected: statusFilter == "pending") { statusFilter = "pending"; load() }
                FilterChip(title: "Done", selected: statusFilter == "done") { statusFilter = "done"; load() }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.secondarySystemGroupedBackground))
    }

    private var createButton: some View {
        Button("New task") { showCreate = true }
            .buttonStyle(.borderedProminent)
            .padding()
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadAsync() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            async let tasksTask = ManagerAPI.tasks(projectId: selectedProjectId, status: statusFilter, limit: 100)
            async let projectsTask = ManagerAPI.projects()
            tasks = try await tasksTask
            if projects.isEmpty { projects = try await projectsTask }
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct TaskRowView: View {
    let task: TaskDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(task.title)
                .font(.subheadline)
            HStack {
                Text(task.status ?? "—")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let d = task.dueDate {
                    Text("Due: \(d)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct TaskDetailManagerView: View {
    let taskId: String
    @State private var task: TaskDetailDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && task == nil && errorMessage == nil {
                LoadingStateView(message: "Loading task…")
            } else if let err = errorMessage, task == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let t = task {
                List {
                    Section("Task") {
                        LabeledContent("Title", value: t.title ?? "—")
                        LabeledContent("Status", value: t.status ?? "—")
                        if let d = t.dueDate { LabeledContent("Due", value: d) }
                        if let r = t.reportId { LabeledContent("Report", value: r) }
                        if let s = t.reportStatus { LabeledContent("Report status", value: s) }
                    }
                }
                .navigationTitle(t.title ?? "Task")
            } else {
                EmptyStateView(title: "Task not found", subtitle: nil)
            }
        }
        .onAppear { load() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task {
            defer { isLoading = false }
            do {
                task = try await ManagerAPI.taskDetail(id: taskId)
            } catch let e as APIError {
                errorMessage = e.message
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct TaskCreateEditView: View {
    let projectId: String
    let projectName: String?
    let onDismiss: () -> Void
    @State private var title = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Project") {
                    Text(projectName ?? projectId)
                }
                Section("Title") {
                    TextField("Task title", text: $title)
                }
                if let err = errorMessage {
                    Section {
                        Text(err)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("New task")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { onDismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { submit() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
        }
    }

    private func submit() {
        let t = title.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return }
        errorMessage = nil
        isSubmitting = true
        Task {
            defer { isSubmitting = false }
            do {
                _ = try await ManagerAPI.createTask(projectId: projectId, title: t, idempotencyKey: UUID().uuidString)
                onDismiss()
            } catch let e as APIError {
                errorMessage = e.message
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
