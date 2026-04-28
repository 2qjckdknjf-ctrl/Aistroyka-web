//
//  TasksListView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct TasksListView: View {
    var initialProjectId: String? = nil
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
                    LoadingStateView(message: NSLocalizedString("mgr_loading_tasks", comment: ""))
                } else if let err = errorMessage, tasks.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if tasks.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_tasks_title", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_tasks_subtitle", comment: "")
                    )
                        .overlay(alignment: .bottom) {
                            createButton
                        }
                } else {
                    listContent
                }
            }
            .navigationTitle(NSLocalizedString("mgr_tab_tasks", comment: ""))
            .toolbar { ToolbarItem(placement: .primaryAction) { Button(NSLocalizedString("mgr_new", comment: ""), systemImage: "plus") { showCreate = true } } }
            .refreshable { await loadAsync() }
            .onAppear {
                if let id = initialProjectId, selectedProjectId == nil { selectedProjectId = id }
                loadIfNeeded()
            }
            .sheet(isPresented: $showCreate) {
                if let proj = projects.first ?? projects.first(where: { $0.id == selectedProjectId }) {
                    TaskCreateEditView(projectId: proj.id, projectName: proj.name, onDismiss: { showCreate = false; load() })
                } else {
                    Text(NSLocalizedString("mgr_load_projects_first", comment: ""))
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button(NSLocalizedString("mgr_close", comment: "")) { showCreate = false } } }
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
                FilterChip(title: NSLocalizedString("mgr_all_projects", comment: ""), selected: selectedProjectId == nil) { selectedProjectId = nil; load() }
                ForEach(projects.prefix(5), id: \.id) { p in
                    FilterChip(title: p.name ?? p.id, selected: selectedProjectId == p.id) {
                        selectedProjectId = p.id
                        load()
                    }
                }
                FilterChip(title: NSLocalizedString("mgr_all_status", comment: ""), selected: statusFilter == nil) { statusFilter = nil; load() }
                FilterChip(title: NSLocalizedString("mgr_status_pending", comment: ""), selected: statusFilter == "pending") { statusFilter = "pending"; load() }
                FilterChip(title: NSLocalizedString("mgr_status_done", comment: ""), selected: statusFilter == "done") { statusFilter = "done"; load() }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.secondarySystemGroupedBackground))
    }

    private var createButton: some View {
        Button(NSLocalizedString("mgr_new_task", comment: "")) { showCreate = true }
            .buttonStyle(.borderedProminent)
            .padding()
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: tasks, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
            async let tasksTask = ManagerAPI.tasks(projectId: selectedProjectId, status: statusFilter, limit: 100)
            async let projectsTask = ManagerAPI.projects()
            tasks = try await tasksTask
            if projects.isEmpty { projects = try await projectsTask }
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
                Text(task.status)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let d = task.dueDate {
                    Text(String(format: NSLocalizedString("mgr_due_fmt", comment: ""), d))
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
    @State private var showAssignPicker = false
    @State private var assignError: String?
    @State private var assignSuccessMessage: String?
    @State private var isAssigning = false

    var body: some View {
        Group {
            if isLoading && task == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_task", comment: ""))
            } else if let err = errorMessage, task == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let t = task {
                List {
                    Section(NSLocalizedString("mgr_task_section", comment: "")) {
                        LabeledContent(NSLocalizedString("mgr_title", comment: ""), value: t.title ?? "—")
                        LabeledContent(NSLocalizedString("mgr_status", comment: ""), value: t.status ?? "—")
                        if let d = t.dueDate { LabeledContent(NSLocalizedString("mgr_due", comment: ""), value: d) }
                        if let a = t.assignedTo { LabeledContent(NSLocalizedString("mgr_assigned_to", comment: ""), value: a) }
                        if let r = t.reportId { LabeledContent(NSLocalizedString("mgr_report", comment: ""), value: r) }
                        if let s = t.reportStatus { LabeledContent(NSLocalizedString("mgr_report_status", comment: ""), value: s) }
                    }
                    Section(NSLocalizedString("mgr_assign_section", comment: "")) {
                        Button {
                            showAssignPicker = true
                            assignError = nil
                        } label: {
                            HStack {
                                Text(NSLocalizedString("mgr_assign_to_worker", comment: ""))
                                if isAssigning { Spacer(); ProgressView() }
                            }
                        }
                        .disabled(isAssigning)
                        if let err = assignError {
                            Text(err)
                                .foregroundStyle(.red)
                                .font(.caption)
                        }
                    }
                }
                .navigationTitle(t.title ?? NSLocalizedString("mgr_task_section", comment: ""))
                .refreshable { await loadAsync() }
                .sheet(isPresented: $showAssignPicker) {
                    TaskAssigneePickerView(
                        taskId: taskId,
                        currentAssignedTo: task?.assignedTo,
                        onSelect: { workerId in
                            assign(to: workerId)
                            showAssignPicker = false
                        },
                        onDismiss: { showAssignPicker = false }
                    )
                }
            } else {
                EmptyStateView(title: NSLocalizedString("mgr_task_not_found", comment: ""), subtitle: nil)
            }
        }
        .onAppear { loadIfNeeded() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(item: task, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
            task = try await ManagerAPI.taskDetail(id: taskId)
        }
    }

    private func assign(to workerId: String) {
        assignSuccessMessage = nil
        Task {
            let success = await runManagerAction(
                isLoading: &isAssigning,
                errorMessage: &assignError
            ) {
                try await ManagerAPI.assignTask(taskId: taskId, workerId: workerId, idempotencyKey: UUID().uuidString)
                await loadAsync()
            }
            if success {
                assignSuccessMessage = NSLocalizedString("mgr_assigned", comment: "")
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 2_500_000_000)
                    assignSuccessMessage = nil
                }
            }
        }
    }
}

/// Assignee picker sheet: list workers, tap to assign.
struct TaskAssigneePickerView: View {
    let taskId: String
    let currentAssignedTo: String?
    let onSelect: (String) -> Void
    let onDismiss: () -> Void
    @State private var workers: [WorkerRowDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && workers.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_workers", comment: ""))
                } else if let err = errorMessage, workers.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if workers.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_workers_short_title", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_workers_short_subtitle", comment: "")
                    )
                } else {
                    List(workers, id: \.userId) { w in
                        Button {
                            onSelect(w.userId)
                        } label: {
                            HStack(alignment: .center, spacing: 12) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(workerDisplayId(w.userId))
                                        .font(.subheadline)
                                        .fontWeight(w.userId == currentAssignedTo ? .medium : .regular)
                                    if let subtitle = workerSubtitle(w) {
                                        Text(subtitle)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                Spacer(minLength: 8)
                                if w.userId == currentAssignedTo {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.green)
                                        .font(.body)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle(NSLocalizedString("mgr_assign_to", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(NSLocalizedString("mgr_cancel", comment: "")) { onDismiss() } }
            }
            .onAppear { loadIfNeeded() }
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: workers, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
                workers = try await ManagerAPI.workers(limit: 200)
        }
    }

    private func workerDisplayId(_ userId: String) -> String {
        if userId.count <= 12 { return userId }
        return String(userId.prefix(8)) + "…"
    }

    private func workerSubtitle(_ w: WorkerRowDTO) -> String? {
        if let s = w.lastReportSubmittedAt, !s.isEmpty {
            return String(format: NSLocalizedString("mgr_last_report_fmt", comment: ""), shortDate(s))
        }
        if let d = w.lastDayDate, !d.isEmpty {
            return String(format: NSLocalizedString("mgr_last_day_fmt", comment: ""), d)
        }
        return nil
    }

    private func shortDate(_ s: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = f.date(from: s) ?? ISO8601DateFormatter().date(from: String(s.prefix(10)) + "T00:00:00Z") {
            return date.formatted(date: .abbreviated, time: .omitted)
        }
        return String(s.prefix(10))
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
                Section(NSLocalizedString("mgr_project_section", comment: "")) {
                    Text(projectName ?? projectId)
                }
                Section(NSLocalizedString("mgr_title_section", comment: "")) {
                    TextField(NSLocalizedString("mgr_task_title_placeholder", comment: ""), text: $title)
                }
                if let err = errorMessage {
                    Section {
                        Text(err)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(NSLocalizedString("mgr_new_task", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(NSLocalizedString("mgr_cancel", comment: "")) { onDismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("mgr_create", comment: "")) { submit() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
        }
    }

    private func submit() {
        let t = title.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return }
        Task {
            let success = await runManagerAction(
                isLoading: &isSubmitting,
                errorMessage: &errorMessage
            ) {
                _ = try await ManagerAPI.createTask(projectId: projectId, title: t, idempotencyKey: UUID().uuidString)
            }
            if success {
                onDismiss()
            }
        }
    }
}
