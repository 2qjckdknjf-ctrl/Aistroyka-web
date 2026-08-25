//
//  TasksListView.swift
//  AiStroyka Manager
//

import SwiftUI
import PhotosUI
import UIKit
import Shared

struct TasksListView: View {
    var initialProjectId: String? = nil
    @EnvironmentObject var router: ManagerTabRouter
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @State private var tasks: [TaskDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var chip: TaskChip = .all
    @State private var viewMode: TaskViewMode = .list
    @State private var showCreate = false
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var loadGeneration = 0
    @State private var deepLinkTaskId: String?
    @State private var unreadByTaskId: [String: Bool] = [:]
    @State private var selectedDay = Date()
    @State private var lastSync: Date?
    @State private var search = ""
    @State private var reviewTaskIds: Set<String> = []

    private enum TaskChip: String {
        case all, today, overdue, review
    }

    private enum TaskViewMode: String {
        case list, calendar
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && tasks.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_tasks", comment: ""))
                } else if let err = errorMessage, tasks.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else {
                    listContent
                }
            }
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
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
            .onChange(of: router.selectedTab) { tab in
                if tab != .tasks { showCreate = false }
            }
            .onAppear {
                if let id = initialProjectId, selectedProjectId == nil { selectedProjectId = id }
                if router.tasksFocusOverdue {
                    chip = .overdue
                    router.tasksFocusOverdue = false
                }
                if tasks.isEmpty, let cached = ManagerCacheStore.load([TaskDTO].self, key: "mgr.v43.tasks") {
                    tasks = cached
                    lastSync = ManagerCacheStore.lastSync(key: "mgr.v43.tasks")
                }
                loadIfNeeded()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.tasksChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
                load()
            }
            .sheet(isPresented: $showCreate) {
                if let proj = projects.first(where: { $0.id == selectedProjectId }) ?? projects.first {
                    TaskCreateEditView(projectId: proj.id, projectName: proj.name, onDismiss: { showCreate = false; load() })
                } else {
                    NavigationStack {
                        VStack(spacing: 16) {
                            Text(NSLocalizedString("mgr_load_projects_first", comment: ""))
                                .foregroundStyle(ManagerV43.textPrimary)
                                .multilineTextAlignment(.center)
                            ManagerV43PrimaryButton(title: NSLocalizedString("mgr_close", comment: "")) {
                                showCreate = false
                            }
                            .accessibilityIdentifier("pilot_manager_create_task_close")
                        }
                        .padding(ManagerV43.screenX)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(ManagerV43.bg.ignoresSafeArea())
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button(NSLocalizedString("mgr_close", comment: "")) { showCreate = false }
                            }
                        }
                    }
                }
            }
        }
    }

    private var visibleTasks: [TaskDTO] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return tasks.filter { task in
            if !needle.isEmpty {
                let matchesTitle = task.title.localizedCaseInsensitiveContains(needle)
                let matchesId = task.id.lowercased().hasPrefix(needle.lowercased())
                if !matchesTitle && !matchesId { return false }
            }
            if viewMode == .calendar, !isSameDay(task, as: selectedDay) {
                return false
            }
            switch chip {
            case .all: return true
            case .today: return isSameDay(task, as: Date())
            case .overdue: return ManagerV43Formatters.isTaskOverdue(status: task.status, dueDate: task.dueDate)
            case .review:
                if reviewTaskIds.contains(task.id) { return true }
                return ManagerV43Preview.isEnabled && task.status.lowercased() == "review"
            }
        }
    }

    private var groupedTasks: [(String, [TaskDTO])] {
        let groups = Dictionary(grouping: visibleTasks) { task in
            ManagerV43Formatters.dayGroup(createdAt: task.dueDate ?? task.createdAt)
        }
        let order = ["today", "yesterday", "earlier"]
        return order.compactMap { key in
            guard let items = groups[key], !items.isEmpty else { return nil }
            return (key, items)
        }
    }

    private var listContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                header
                if !networkMonitor.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                        .padding(.horizontal, ManagerV43.screenX)
                }
                if viewMode == .calendar {
                    ManagerDateStrip(
                        days: (0..<7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: Calendar.current.startOfDay(for: Date())) },
                        selected: $selectedDay
                    )
                    .padding(.horizontal, ManagerV43.screenX)
                }
                chipsBar
                searchField
                projectMenu
                if visibleTasks.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_tasks_title", comment: ""),
                        subtitle: viewMode == .calendar
                            ? NSLocalizedString("mgr_v43_no_tasks_day", comment: "")
                            : NSLocalizedString("mgr_no_tasks_subtitle", comment: "")
                    )
                    .frame(minHeight: 180)
                } else if viewMode == .list {
                    ForEach(groupedTasks, id: \.0) { group in
                        Text(dayTitle(group.0))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(ManagerV43.textSecondary)
                            .padding(.horizontal, ManagerV43.screenX)
                            .padding(.top, 4)
                        ForEach(group.1, id: \.id) { task in
                            NavigationLink(destination: TaskDetailManagerView(taskId: task.id)) {
                                TaskRowView(task: task, projectName: projectName(for: task), hasUnreadChat: unreadByTaskId[task.id] == true)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, ManagerV43.screenX)
                        }
                    }
                } else {
                    ForEach(visibleTasks, id: \.id) { task in
                        NavigationLink(destination: TaskDetailManagerView(taskId: task.id)) {
                            TaskRowView(task: task, projectName: projectName(for: task), hasUnreadChat: unreadByTaskId[task.id] == true)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, ManagerV43.screenX)
                    }
                }
            }
            .padding(.bottom, 88)
        }
        .accessibilityIdentifier("pilot_manager_tasks_ready")
        .safeAreaInset(edge: .bottom) {
            createButton
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text(NSLocalizedString("mgr_tab_tasks", comment: ""))
                .font(.system(size: 32, weight: .semibold))
                .foregroundStyle(ManagerV43.textPrimary)
                .minimumScaleFactor(0.8)
                .lineLimit(1)
            Spacer()
            HStack(spacing: 0) {
                modeButton(.list, "list.bullet", NSLocalizedString("mgr_v43_tasks_list", comment: ""))
                modeButton(.calendar, "calendar", NSLocalizedString("mgr_v43_tasks_calendar", comment: ""))
            }
            .background(ManagerV43.cardStrong)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .padding(.horizontal, ManagerV43.screenX)
        .padding(.top, 8)
    }

    private func modeButton(_ mode: TaskViewMode, _ icon: String, _ label: String) -> some View {
        Button {
            viewMode = mode
        } label: {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(viewMode == mode ? ManagerV43.yellowInk : ManagerV43.textSecondary)
                .frame(width: 40, height: 36)
                .background(viewMode == mode ? ManagerV43.yellow : Color.clear)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(viewMode == mode ? .isSelected : [])
    }

    private var chipsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ManagerV43Chip(title: NSLocalizedString("mgr_all", comment: ""), selected: chip == .all) { chip = .all }
                ManagerV43Chip(title: NSLocalizedString("mgr_v43_today", comment: ""), selected: chip == .today) { chip = .today }
                ManagerV43Chip(title: NSLocalizedString("mgr_v43_chip_overdue", comment: ""), selected: chip == .overdue) { chip = .overdue }
                ManagerV43Chip(title: NSLocalizedString("mgr_v43_chip_review", comment: ""), selected: chip == .review) { chip = .review }
            }
            .padding(.horizontal, ManagerV43.screenX)
        }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(ManagerV43.textSecondary)
            TextField(NSLocalizedString("mgr_v43_search_tasks", comment: ""), text: $search)
                .foregroundStyle(ManagerV43.textPrimary)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.search)
                .onSubmit { load(clearTasks: false) }
                .onChange(of: search) { newValue in
                    if newValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        load(clearTasks: false)
                    }
                }
        }
        .padding(.horizontal, 12)
        .frame(minHeight: ManagerV43.touch)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .padding(.horizontal, ManagerV43.screenX)
        .accessibilityIdentifier("pilot_manager_tasks_search")
    }

    private var projectMenu: some View {
        Menu {
            Button(NSLocalizedString("mgr_all_projects", comment: "")) { selectProjectFilter(nil) }
            ForEach(projects, id: \.id) { project in
                Button(project.name ?? project.id) { selectProjectFilter(project.id) }
            }
        } label: {
            HStack {
                Text(projects.first(where: { $0.id == selectedProjectId })?.name ?? NSLocalizedString("mgr_all_projects", comment: ""))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.down")
                    .foregroundStyle(ManagerV43.textSecondary)
            }
            .padding(.horizontal, 12)
            .frame(minHeight: ManagerV43.touch)
            .background(ManagerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .padding(.horizontal, ManagerV43.screenX)
        }
        .accessibilityLabel(NSLocalizedString("mgr_all_projects", comment: ""))
    }

    private func projectName(for task: TaskDTO) -> String? {
        projects.first(where: { $0.id == task.projectId })?.name
    }

    private func isSameDay(_ task: TaskDTO, as day: Date) -> Bool {
        guard let date = ManagerV43Formatters.parseISODate(task.dueDate) else { return false }
        return Calendar.current.isDate(date, inSameDayAs: day)
    }

    private func dayTitle(_ key: String) -> String {
        switch key {
        case "today": return NSLocalizedString("mgr_v43_today", comment: "")
        case "yesterday": return NSLocalizedString("mgr_v43_yesterday", comment: "")
        default: return NSLocalizedString("mgr_v43_earlier", comment: "")
        }
    }

    private var createButton: some View {
        ManagerV43PrimaryButton(
            title: NSLocalizedString("mgr_v43_create_task", comment: ""),
            systemImage: "plus",
            enabled: !projects.isEmpty,
            loading: isLoading && projects.isEmpty
        ) { showCreate = true }
            .padding(.horizontal, ManagerV43.screenX)
            .padding(.bottom, 8)
            .accessibilityIdentifier("pilot_manager_create_task")
    }

    @MainActor
    private func selectProjectFilter(_ projectId: String?) {
        guard selectedProjectId != projectId else { return }
        selectedProjectId = projectId
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
        Task { await loadAsync(generation: generation, projectId: projectId, status: nil, query: trimmedSearch) }
    }

    private func loadIfNeeded() {
        if errorMessage != nil { return }
        if tasks.isEmpty || projects.isEmpty {
            load()
        }
    }

    @MainActor
    private func refreshAsync() async {
        loadGeneration += 1
        let generation = loadGeneration
        await loadAsync(generation: generation, projectId: selectedProjectId, status: nil, query: trimmedSearch)
    }

    private var trimmedSearch: String? {
        let value = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }

    @MainActor
    private func loadAsync(generation: Int, projectId: String?, status: String?, query: String?) async {
        let shouldLoadProjects = projects.isEmpty
        await runManagerLoad(
            setLoading: { if generation == loadGeneration { isLoading = $0 } },
            setErrorMessage: { if generation == loadGeneration { errorMessage = $0 } },
            previewFallback: {
                tasks = ManagerDemoCatalog.tasks
                projects = ManagerDemoCatalog.projects
                reviewTaskIds = Set(tasks.filter { $0.status.lowercased() == "review" }.map(\.id))
                lastSync = Date()
                router.tasksBadge = tasks.filter { ManagerV43Formatters.isTaskOverdue(status: $0.status, dueDate: $0.dueDate) }.count
            }
        ) {
            if shouldLoadProjects {
                async let tasksTask = ManagerAPI.tasks(projectId: projectId, status: status, query: query, limit: 100)
                async let projectsTask = ManagerAPI.projects()
                async let reportsTask = ManagerAPI.reports(projectId: projectId, limit: 100)
                let loadedTasks = try await tasksTask
                let loadedProjects = try await projectsTask
                let loadedReports = (try? await reportsTask) ?? []
                guard generation == loadGeneration else { return }
                tasks = loadedTasks
                projects = loadedProjects
                reviewTaskIds = Set(loadedReports.filter { ManagerV43Formatters.isReportPendingReview($0.status) }.compactMap(\.taskId))
                lastSync = Date()
                ManagerCacheStore.save(loadedTasks, key: "mgr.v43.tasks")
                router.tasksBadge = loadedTasks.filter { ManagerV43Formatters.isTaskOverdue(status: $0.status, dueDate: $0.dueDate) }.count
                await refreshUnreadBadges(for: loadedTasks)
                return
            }

            let loadedTasks = try await ManagerAPI.tasks(projectId: projectId, status: status, query: query, limit: 100)
            let loadedReports = (try? await ManagerAPI.reports(projectId: projectId, limit: 100)) ?? []
            guard generation == loadGeneration else { return }
            tasks = loadedTasks
            reviewTaskIds = Set(loadedReports.filter { ManagerV43Formatters.isReportPendingReview($0.status) }.compactMap(\.taskId))
            lastSync = Date()
            ManagerCacheStore.save(loadedTasks, key: "mgr.v43.tasks")
            router.tasksBadge = loadedTasks.filter { ManagerV43Formatters.isTaskOverdue(status: $0.status, dueDate: $0.dueDate) }.count
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
    var projectName: String? = nil
    var hasUnreadChat: Bool = false

    var body: some View {
        let priority = ManagerV43Formatters.taskPriority(from: task.status, dueDate: task.dueDate, stored: task.priority)
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(task.title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)
                HStack(spacing: 8) {
                    ManagerV43StatusPill(text: priorityLabel(priority), kind: pillKind(priority))
                    if let projectName {
                        Text(projectName)
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                            .lineLimit(1)
                    }
                }
                if let due = formattedDue(task.dueDate) {
                    Text(String(format: NSLocalizedString("mgr_due_fmt", comment: ""), due))
                        .font(.caption)
                        .foregroundStyle(priority == "high" ? ManagerV43.danger : ManagerV43.textSecondary)
                }
            }
            Spacer(minLength: 0)
            if hasUnreadChat {
                Circle()
                    .fill(ManagerV43.yellow)
                    .frame(width: 8, height: 8)
                    .accessibilityLabel(NSLocalizedString("task_chat_unread", comment: ""))
            }
            Image(systemName: "chevron.right")
                .foregroundStyle(ManagerV43.textSecondary)
        }
        .padding(12)
        .background(ManagerV43.card)
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(priority == "high" ? ManagerV43.danger.opacity(0.45) : ManagerV43.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func priorityLabel(_ priority: String) -> String {
        switch priority {
        case "high": return NSLocalizedString("mgr_v43_priority_high", comment: "")
        case "review": return NSLocalizedString("mgr_v43_chip_review", comment: "")
        case "low": return NSLocalizedString("mgr_v43_priority_low", comment: "")
        default: return NSLocalizedString("mgr_v43_priority_medium", comment: "")
        }
    }

    private func formattedDue(_ raw: String?) -> String? {
        guard let raw, !raw.isEmpty else { return nil }
        if let date = ManagerV43Formatters.parseISODate(raw) {
            return DateFormatter.localizedString(from: date, dateStyle: .medium, timeStyle: .none)
        }
        return raw
    }

    private func pillKind(_ priority: String) -> ManagerV43StatusPill.Kind {
        switch priority {
        case "high": return .danger
        case "review": return .ai
        case "low": return .success
        default: return .warning
        }
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
    @State private var isPatching = false
    @State private var managerUserId: String?
    @State private var members: [TenantMemberDTO] = []

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
                            if let p = t.priority, !p.isEmpty {
                                LabeledContent(NSLocalizedString("mgr_v43_priority", comment: ""), value: localizedPriority(p))
                            }
                            if let a = t.assignedTo {
                                LabeledContent(NSLocalizedString("mgr_assigned_to", comment: ""), value: assignedLabel(a))
                            }
                            if let r = t.reportId, !r.isEmpty {
                                NavigationLink(destination: ReportDetailReviewView(reportId: r)) {
                                    LabeledContent(
                                        NSLocalizedString("mgr_v43_open_linked_report", comment: ""),
                                        value: ManagerV43Formatters.shortIdentifier(r)
                                    )
                                }
                                .accessibilityIdentifier("pilot_manager_task_open_report")
                            }
                            if let s = t.reportStatus { LabeledContent(NSLocalizedString("mgr_report_status", comment: ""), value: s) }
                            if let desc = t.description, !desc.isEmpty {
                                LabeledContent(NSLocalizedString("mgr_v43_description", comment: ""), value: desc)
                            }
                            if t.reportRequired == true {
                                Label(NSLocalizedString("mgr_v43_require_photo", comment: ""), systemImage: "camera.fill")
                            }
                        }
                        Section(NSLocalizedString("mgr_v43_priority", comment: "")) {
                            HStack(spacing: 8) {
                                priorityPatchChip("low", NSLocalizedString("mgr_v43_priority_low", comment: ""), ManagerV43.success, current: t.priority)
                                priorityPatchChip("medium", NSLocalizedString("mgr_v43_priority_medium", comment: ""), ManagerV43.warning, current: t.priority)
                                priorityPatchChip("high", NSLocalizedString("mgr_v43_priority_high", comment: ""), ManagerV43.danger, current: t.priority)
                            }
                        }
                        Section(NSLocalizedString("mgr_v43_task_actions", comment: "")) {
                            Button(NSLocalizedString("mgr_v43_task_mark_done", comment: "")) {
                                patchStatus("done")
                            }
                            .disabled(isPatching || (t.status ?? "").lowercased() == "done")
                            Button(NSLocalizedString("mgr_v43_task_cancel_status", comment: ""), role: .destructive) {
                                patchStatus("cancelled")
                            }
                            .disabled(isPatching || (t.status ?? "").lowercased() == "cancelled")
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
                        projectId: task?.projectId,
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
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.tasksChanged)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.reportsChanged)) { _ in
            load()
        }
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
            members = (try? await ManagerAPI.tenantMembers()) ?? members
        }
    }

    private func assignedLabel(_ userId: String) -> String {
        let short = ManagerV43Formatters.shortIdentifier(userId)
        if let role = members.first(where: { $0.userId == userId })?.role, !role.isEmpty {
            return "\(short) · \(role)"
        }
        return short
    }

    private func localizedPriority(_ raw: String) -> String {
        switch raw.lowercased() {
        case "high": return NSLocalizedString("mgr_v43_priority_high", comment: "")
        case "low": return NSLocalizedString("mgr_v43_priority_low", comment: "")
        default: return NSLocalizedString("mgr_v43_priority_medium", comment: "")
        }
    }

    private func priorityPatchChip(_ value: String, _ title: String, _ color: Color, current: String?) -> some View {
        let selected = (current ?? "").lowercased() == value
        return Button {
            patchPriority(value)
        } label: {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(selected ? .white : color)
                .frame(maxWidth: .infinity, minHeight: 36)
                .background(selected ? color : color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isPatching)
    }

    private func patchPriority(_ priority: String) {
        Task {
            let success = await runManagerAction(
                setLoading: { isPatching = $0 },
                setErrorMessage: { assignError = $0 }
            ) {
                try await ManagerAPI.patchTask(taskId: taskId, priority: priority, idempotencyKey: UUID().uuidString)
            }
            if success {
                ManagerLiveSync.post(ManagerLiveSync.tasksChanged)
                await loadAsync()
            }
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
                ManagerLiveSync.post(ManagerLiveSync.tasksChanged)
                await loadAsync()
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: 2_500_000_000)
                    assignSuccessMessage = nil
                }
            }
        }
    }

    private func patchStatus(_ status: String) {
        Task {
            let success = await runManagerAction(
                setLoading: { isPatching = $0 },
                setErrorMessage: { assignError = $0 }
            ) {
                try await ManagerAPI.patchTask(taskId: taskId, status: status, idempotencyKey: UUID().uuidString)
            }
            if success {
                ManagerLiveSync.post(ManagerLiveSync.tasksChanged)
                await loadAsync()
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
            reportStatus: current.reportStatus,
            description: current.description,
            reportRequired: current.reportRequired,
            priority: current.priority
        )
    }
}

/// Assignee picker sheet: list workers, tap to assign.
struct TaskAssigneePickerView: View {
    let taskId: String
    var projectId: String? = nil
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
                if let projectId, let scoped = try? await ManagerAPI.projectWorkers(projectId: projectId), !scoped.isEmpty {
                    workers = scoped.map { WorkerRowDTO(userId: $0.userId) }
                } else {
                    workers = try await ManagerAPI.workers(limit: 200)
                }
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
    @State private var details = ""
    @State private var due = Date()
    @State private var hasDue = true
    @State private var priority: Priority = .medium
    @State private var requirePhoto = true
    @State private var aiCheck = true
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var pickedItems: [PhotosPickerItem] = []
    @State private var createdTaskId: String?
    @State private var assignedWorkerId: String?
    @State private var showAssigneePicker = false

    enum Priority: String, CaseIterable {
        case low, medium, high
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    field(NSLocalizedString("mgr_v43_task_name", comment: "")) {
                        TextField(NSLocalizedString("mgr_task_title_placeholder", comment: ""), text: $title)
                            .foregroundStyle(ManagerV43.textPrimary)
                            .accessibilityIdentifier("pilot_manager_create_task_title")
                    }
                    row(icon: "folder", label: NSLocalizedString("mgr_project", comment: ""), value: projectName ?? projectId)
                    Button { showAssigneePicker = true } label: {
                        row(
                            icon: "person",
                            label: NSLocalizedString("mgr_assign_to", comment: ""),
                            value: assignedWorkerLabel
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("pilot_manager_create_task_assign")
                    DatePicker(NSLocalizedString("mgr_due", comment: ""), selection: $due, displayedComponents: [.date, .hourAndMinute])
                        .tint(ManagerV43.yellow)
                        .foregroundStyle(ManagerV43.textPrimary)

                    Text(NSLocalizedString("mgr_v43_priority", comment: ""))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                    HStack(spacing: 8) {
                        priorityChip(.low, NSLocalizedString("mgr_v43_priority_low", comment: ""), ManagerV43.success)
                        priorityChip(.medium, NSLocalizedString("mgr_v43_priority_medium", comment: ""), ManagerV43.warning)
                        priorityChip(.high, NSLocalizedString("mgr_v43_priority_high", comment: ""), ManagerV43.danger)
                    }

                    field(NSLocalizedString("mgr_v43_description", comment: "")) {
                        TextField(NSLocalizedString("mgr_v43_description_placeholder", comment: ""), text: $details, axis: .vertical)
                            .lineLimit(3...6)
                            .foregroundStyle(ManagerV43.textPrimary)
                    }

                    PhotosPicker(selection: $pickedItems, maxSelectionCount: 6, matching: .images) {
                        Label(NSLocalizedString("mgr_v43_add_photo_file", comment: ""), systemImage: "camera")
                            .foregroundStyle(ManagerV43.textSecondary)
                            .frame(maxWidth: .infinity, minHeight: 88)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(style: StrokeStyle(lineWidth: 1, dash: [6])))
                            .foregroundStyle(ManagerV43.border)
                    }
                    .accessibilityLabel(NSLocalizedString("mgr_v43_add_photo_file", comment: ""))
                    if !pickedItems.isEmpty {
                        Text(String(format: NSLocalizedString("mgr_v43_photos_picked_fmt", comment: ""), pickedItems.count))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textPrimary)
                    }
                    Text(NSLocalizedString("mgr_v43_photos_to_chat", comment: ""))
                        .font(.caption2)
                        .foregroundStyle(ManagerV43.textSecondary)

                    toggleRow(
                        title: NSLocalizedString("mgr_v43_require_photo", comment: ""),
                        subtitle: NSLocalizedString("mgr_v43_require_photo_sub", comment: ""),
                        isOn: $requirePhoto
                    )
                    toggleRow(
                        title: NSLocalizedString("mgr_v43_ai_check", comment: ""),
                        subtitle: NSLocalizedString("mgr_v43_optional", comment: ""),
                        isOn: $aiCheck,
                        tint: ManagerV43.aiViolet
                    )

                    if let err = errorMessage {
                        Text(err).foregroundStyle(ManagerV43.danger).font(.caption)
                    }

                    ManagerV43PrimaryButton(
                        title: NSLocalizedString("mgr_v43_create_task", comment: ""),
                        enabled: !title.trimmingCharacters(in: .whitespaces).isEmpty && !isSubmitting,
                        loading: isSubmitting,
                        action: submit
                    )
                }
                .padding(ManagerV43.screenX)
            }
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("mgr_new_task", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("mgr_cancel", comment: ""), action: onDismiss)
                        .foregroundStyle(ManagerV43.yellow)
                        .accessibilityIdentifier("pilot_manager_create_task_cancel")
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("mgr_create", comment: ""), action: submit)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                        .foregroundStyle(title.isEmpty ? ManagerV43.textSecondary : ManagerV43.yellow)
                }
            }
            .sheet(isPresented: $showAssigneePicker) {
                TaskAssigneePickerView(
                    taskId: createdTaskId ?? "",
                    projectId: projectId,
                    currentAssignedTo: assignedWorkerId,
                    onSelect: { workerId in
                        assignedWorkerId = workerId
                        showAssigneePicker = false
                    },
                    onDismiss: { showAssigneePicker = false }
                )
            }
        }
    }

    private var assignedWorkerLabel: String {
        guard let assignedWorkerId, !assignedWorkerId.isEmpty else {
            return NSLocalizedString("mgr_v43_unassigned", comment: "")
        }
        return ManagerV43Formatters.shortIdentifier(assignedWorkerId)
    }

    private func field(_ label: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption).foregroundStyle(ManagerV43.textSecondary)
            content()
                .padding(12)
                .background(ManagerV43.card)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.border, lineWidth: 1))
        }
    }

    private func row(icon: String, label: String, value: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(ManagerV43.dataBlue)
            Text(label).foregroundStyle(ManagerV43.textSecondary)
            Spacer()
            Text(value).foregroundStyle(ManagerV43.textPrimary)
        }
        .padding(12)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func priorityChip(_ value: Priority, _ title: String, _ color: Color) -> some View {
        Button { priority = value } label: {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(priority == value ? .white : color)
                .frame(maxWidth: .infinity, minHeight: 40)
                .background(priority == value ? color : color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func toggleRow(title: String, subtitle: String, isOn: Binding<Bool>, tint: Color = ManagerV43.dataBlue) -> some View {
        Toggle(isOn: isOn) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).foregroundStyle(ManagerV43.textPrimary)
                Text(subtitle).font(.caption).foregroundStyle(ManagerV43.textSecondary)
            }
        }
        .tint(tint)
        .padding(12)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func submit() {
        let t = title.trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return }
        let iso = ISO8601DateFormatter()
        Task {
            let success = await runManagerAction(
                setLoading: { isSubmitting = $0 },
                setErrorMessage: { errorMessage = $0 }
            ) {
                var description = details.trimmingCharacters(in: .whitespacesAndNewlines)
                if aiCheck {
                    let note = NSLocalizedString("mgr_v43_ai_check_note", comment: "")
                    description = description.isEmpty ? note : description + "\n" + note
                }
                let taskId: String
                if let existing = createdTaskId, !existing.isEmpty {
                    taskId = existing
                } else {
                    let created = try await ManagerAPI.createTask(
                        projectId: projectId,
                        title: t,
                        description: description.isEmpty ? nil : description,
                        dueAt: hasDue ? iso.string(from: due) : nil,
                        reportRequired: requirePhoto,
                        requiredPhotos: requirePhoto ? ["after": 1] : nil,
                        priority: priority.rawValue,
                        idempotencyKey: UUID().uuidString
                    )
                    guard let id = created.id, !id.isEmpty else {
                        throw APIError(statusCode: nil, code: nil, message: "No data")
                    }
                    createdTaskId = id
                    taskId = id
                }
                if let workerId = assignedWorkerId, !workerId.isEmpty {
                    try await ManagerAPI.assignTask(
                        taskId: taskId,
                        workerId: workerId,
                        idempotencyKey: UUID().uuidString
                    )
                }
                for item in pickedItems {
                    guard let data = try await item.loadTransferable(type: Data.self), !data.isEmpty else { continue }
                    let kind = MediaUploadHelper.detectImageKind(data: data)
                    let mediaId = try await MediaUploadHelper.uploadChatMedia(
                        data: data,
                        mimeType: kind.mimeType,
                        fileExtension: kind.fileExtension
                    )
                    _ = try await TaskMessagesAPI.sendMedia(
                        taskId: taskId,
                        kind: "image",
                        mediaId: mediaId,
                        durationMs: nil,
                        clientId: UUID().uuidString,
                        idempotencyKey: UUID().uuidString
                    )
                }
            }
            if success {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                ManagerLiveSync.post(ManagerLiveSync.tasksChanged)
                onDismiss()
            }
        }
    }
}
