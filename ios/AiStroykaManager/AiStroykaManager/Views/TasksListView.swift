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
    @State private var loadGeneration = 0
    @State private var deepLinkTaskId: String?
    @State private var unreadByTaskId: [String: Bool] = [:]

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
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("mgr_tab_tasks", comment: ""))
            .toolbar { ToolbarItem(placement: .primaryAction) { Button(NSLocalizedString("mgr_new", comment: ""), systemImage: "plus") { showCreate = true } } }
            .refreshable { await refreshAsync() }
            .navigationDestination(isPresented: Binding(
                get: { deepLinkTaskId != nil },
                set: { if !$0 { deepLinkTaskId = nil } }
            )) {
                if let id = deepLinkTaskId {
                    TaskDetailManagerView(taskId: id)
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .aiStroykaManagerOpenTaskChat)) { note in
                if let taskId = note.userInfo?["task_id"] as? String, !taskId.isEmpty {
                    deepLinkTaskId = taskId
                }
            }
            .onAppear {
                if let id = initialProjectId, selectedProjectId == nil { selectedProjectId = id }
                loadIfNeeded()
            }
            .sheet(isPresented: $showCreate) {
                if let proj = projects.first(where: { $0.id == selectedProjectId }) ?? projects.first {
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
                    TaskRowView(task: t, hasUnreadChat: unreadByTaskId[t.id] == true)
                }
            }
            .aistroykaListChrome(
                pageBackground: ManagerSemanticColors.pageBackground,
                surfaceMuted: ManagerSemanticColors.surfaceMuted
            )
        }
    }

    private var filtersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: NSLocalizedString("mgr_all_projects", comment: ""), selected: selectedProjectId == nil) { selectProjectFilter(nil) }
                ForEach(projects.prefix(5), id: \.id) { p in
                    FilterChip(title: p.name ?? p.id, selected: selectedProjectId == p.id) {
                        selectProjectFilter(p.id)
                    }
                }
                FilterChip(title: NSLocalizedString("mgr_all_status", comment: ""), selected: statusFilter == nil) { selectStatusFilter(nil) }
                FilterChip(title: NSLocalizedString("mgr_status_pending", comment: ""), selected: statusFilter == "pending") { selectStatusFilter("pending") }
                FilterChip(title: NSLocalizedString("mgr_status_done", comment: ""), selected: statusFilter == "done") { selectStatusFilter("done") }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(ManagerSemanticColors.surfaceMuted)
    }

    private var createButton: some View {
        Button(NSLocalizedString("mgr_new_task", comment: "")) { showCreate = true }
            .buttonStyle(.borderedProminent)
            .tint(ManagerSemanticColors.primary)
            .padding()
    }

    @MainActor
    private func selectProjectFilter(_ projectId: String?) {
        guard selectedProjectId != projectId else { return }
        selectedProjectId = projectId
        load(clearTasks: true)
    }

    @MainActor
    private func selectStatusFilter(_ status: String?) {
        guard statusFilter != status else { return }
        statusFilter = status
        load(clearTasks: true)
    }

    @MainActor
    private func load(clearTasks: Bool = false) {
        errorMessage = nil
        isLoading = true
        if clearTasks { tasks = [] }
        loadGeneration += 1
        let generation = loadGeneration
        let projectId = selectedProjectId
        let status = statusFilter
        Task { await loadAsync(generation: generation, projectId: projectId, status: status) }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: tasks, errorMessage: errorMessage) else { return }
        load()
    }

    @MainActor
    private func refreshAsync() async {
        loadGeneration += 1
        let generation = loadGeneration
        await loadAsync(generation: generation, projectId: selectedProjectId, status: statusFilter)
    }

    @MainActor
    private func loadAsync(generation: Int, projectId: String?, status: String?) async {
        let shouldLoadProjects = projects.isEmpty
        await runManagerLoad(
            setLoading: { if generation == loadGeneration { isLoading = $0 } },
            setErrorMessage: { if generation == loadGeneration { errorMessage = $0 } }
        ) {
            if shouldLoadProjects {
                async let tasksTask = ManagerAPI.tasks(projectId: projectId, status: status, limit: 100)
                async let projectsTask = ManagerAPI.projects()
                let loadedTasks = try await tasksTask
                let loadedProjects = try await projectsTask
                guard generation == loadGeneration else { return }
                tasks = loadedTasks
                projects = loadedProjects
                await refreshUnreadBadges(for: loadedTasks)
                return
            }

            let loadedTasks = try await ManagerAPI.tasks(projectId: projectId, status: status, limit: 100)
            guard generation == loadGeneration else { return }
            tasks = loadedTasks
            await refreshUnreadBadges(for: loadedTasks)
        }
    }

    private func refreshUnreadBadges(for tasks: [TaskDTO]) async {
        var map: [String: Bool] = [:]
        await withTaskGroup(of: (String, Bool).self) { group in
            for t in tasks.prefix(40) {
                group.addTask {
                    do {
                        let msgs = try await TaskMessagesAPI.listAll(taskId: t.id, pageSize: 50, maxPages: 3)
                        let latest = msgs.last?.createdAt
                        return (t.id, TaskChatReadStore.isUnread(taskId: t.id, latestCreatedAt: latest))
                    } catch {
                        return (t.id, false)
                    }
                }
            }
            for await (id, unread) in group {
                map[id] = unread
            }
        }
        unreadByTaskId = map
    }
}

struct TaskRowView: View {
    let task: TaskDTO
    var hasUnreadChat: Bool = false

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
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
            Spacer(minLength: 0)
            if hasUnreadChat {
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 8, height: 8)
                    .accessibilityLabel(NSLocalizedString("task_chat_unread", comment: ""))
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
    @State private var managerUserId: String?

    var body: some View {
        Group {
            if isLoading && task == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_task", comment: ""))
            } else if let err = errorMessage, task == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let t = task {
                VStack(spacing: 0) {
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
                                    .foregroundStyle(ManagerSemanticColors.error)
                                    .font(.caption)
                            }
                            if let message = assignSuccessMessage {
                                Text(message)
                                    .foregroundStyle(ManagerSemanticColors.success)
                                    .font(.caption)
                            }
                        }
                    }
                    .frame(maxHeight: 280)
                    .aistroykaListChrome(
                        pageBackground: ManagerSemanticColors.pageBackground,
                        surfaceMuted: ManagerSemanticColors.surfaceMuted
                    )
                    TaskChatView(taskId: taskId, currentUserId: managerUserId)
                        .accessibilityIdentifier("pilot_manager_task_chat")
                }
                .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
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
        .task {
            if let session = await AuthService.shared.currentSession() {
                managerUserId = session.user.id
            }
        }
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
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            task = try await ManagerAPI.taskDetail(id: taskId)
        }
    }

    private func assign(to workerId: String) {
        assignSuccessMessage = nil
        Task {
            let success = await runManagerAction(
                setLoading: { isAssigning = $0 },
                setErrorMessage: { assignError = $0 }
            ) {
                try await ManagerAPI.assignTask(taskId: taskId, workerId: workerId, idempotencyKey: UUID().uuidString)
            }
            if success {
                task = taskAssigned(to: workerId)
                assignSuccessMessage = NSLocalizedString("mgr_assigned", comment: "")
                await loadAsync()
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 2_500_000_000)
                    assignSuccessMessage = nil
                }
            }
        }
    }

    private func taskAssigned(to workerId: String) -> TaskDetailDTO? {
        guard let current = task else { return nil }
        return TaskDetailDTO(
            id: current.id,
            title: current.title,
            status: current.status,
            projectId: current.projectId,
            dueDate: current.dueDate,
            assignedTo: workerId,
            reportId: current.reportId,
            reportStatus: current.reportStatus
        )
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
                                        .foregroundStyle(ManagerSemanticColors.success)
                                        .font(.body)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .aistroykaListChrome(
                        pageBackground: ManagerSemanticColors.pageBackground,
                        surfaceMuted: ManagerSemanticColors.surfaceMuted
                    )
                }
            }
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
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
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
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
                            .foregroundStyle(ManagerSemanticColors.error)
                    }
                }
            }
            .aistroykaFormChrome(
                pageBackground: ManagerSemanticColors.pageBackground,
                surfaceMuted: ManagerSemanticColors.surfaceMuted
            )
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
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
                setLoading: { isSubmitting = $0 },
                setErrorMessage: { errorMessage = $0 }
            ) {
                _ = try await ManagerAPI.createTask(projectId: projectId, title: t, idempotencyKey: UUID().uuidString)
            }
            if success {
                onDismiss()
            }
        }
    }
}
