//
//  ProjectDetailView.swift
//  AiStroyka Manager
//
//  Real project detail: GET /api/v1/projects/:id + GET /api/v1/projects/:id/summary.
//

import SwiftUI
import Shared

struct ProjectDetailView: View {
    let projectId: String
    let projectName: String?
    @State private var project: ProjectDetailDTO?
    @State private var summary: ProjectSummaryDTO?
    @State private var estimate: ProjectEstimateSummaryDTO?
    @State private var todayTasks: [TaskDTO] = []
    @State private var intelligence: ProjectIntelligenceDataDTO?
    @State private var timeline: [ProjectTimelineItemDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && project == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_project", comment: ""))
                    .accessibilityIdentifier("pilot_manager_project_detail_loading")
            } else if let err = errorMessage, project == nil {
                ErrorStateView(message: err, retry: { load() })
                    .accessibilityIdentifier("pilot_manager_project_detail_error")
            } else if let p = project {
                content(project: p)
                    .accessibilityIdentifier("pilot_manager_project_detail_e2e")
            } else {
                EmptyStateView(title: NSLocalizedString("mgr_project_not_found", comment: ""), subtitle: nil)
            }
        }
        .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
        .navigationTitle(project?.name ?? projectName ?? NSLocalizedString("mgr_project", comment: ""))
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.projectsChanged)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.tasksChanged)) { _ in
            load()
        }
    }

    private func content(project p: ProjectDetailDTO) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                commandHeader(p)
                HStack(alignment: .center, spacing: 16) {
                    if let progress = displayedProgress {
                        ManagerProgressRing(progress: progress, size: 100)
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        if let planned = estimate?.budgetSummary?.plannedTotal {
                            Text(NSLocalizedString("mgr_v43_project_budget", comment: ""))
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                            Text(ManagerV43Formatters.compactCurrency(planned, currencyCode: estimate?.budgetSummary?.currency ?? "RUB"))
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(ManagerV43.textPrimary)
                        } else if ManagerV43Preview.isEnabled {
                            Text(ManagerV43Formatters.compactCurrency(ManagerDemoCatalog.featuredBudget, currencyCode: "RUB"))
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(ManagerV43.textPrimary)
                        }
                        if let n = summary?.openReports {
                            Text("\(NSLocalizedString("mgr_open_reports", comment: "")): \(n)")
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                        if let n = summary?.openIssuesCount {
                            Text("\(NSLocalizedString("mgr_open_issues", comment: "")): \(n)")
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                        if let workers = summary?.activeWorkers {
                            Text("\(NSLocalizedString("mgr_v43_workers", comment: "")): \(workers)")
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                    }
                    Spacer()
                }
                .padding(16)
                .background(ManagerV43.card)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                VStack(alignment: .leading, spacing: 10) {
                    Text(NSLocalizedString("mgr_v43_activity", comment: ""))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                    if timeline.isEmpty {
                        Text(NSLocalizedString("mgr_v43_no_activity", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    } else {
                        ForEach(timeline.prefix(8)) { item in
                            timelineRow(item)
                        }
                    }
                }

                if !todayTasks.isEmpty {
                    Text(NSLocalizedString("mgr_v43_today_on_sites", comment: ""))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                    ForEach(todayTasks.prefix(3), id: \.id) { task in
                        NavigationLink(destination: TaskDetailManagerView(taskId: task.id)) {
                            TaskRowView(task: task, projectName: p.name)
                        }
                        .buttonStyle(.plain)
                    }
                }

                NavigationLink(destination: DocumentsHubView(initialProjectId: projectId)) {
                    labelRow("folder", NSLocalizedString("mgr_v43_documents", comment: ""))
                }
                NavigationLink(destination: ProjectAnalyticsView(projectId: projectId, projectName: p.name)) {
                    labelRow("chart.xyaxis.line", NSLocalizedString("mgr_v43_analytics", comment: ""))
                }
                NavigationLink(destination: TasksListForProjectView(projectId: projectId)) {
                    labelRow("checklist", NSLocalizedString("mgr_tab_tasks", comment: ""))
                }
                NavigationLink(destination: ReportsInboxView(initialProjectId: projectId)) {
                    labelRow("doc.text", NSLocalizedString("mgr_tab_reports", comment: ""))
                }
                NavigationLink(destination: TeamOverviewView()) {
                    labelRow("person.3", NSLocalizedString("mgr_tab_team", comment: ""))
                }
                NavigationLink(destination: ProjectIssuesForProjectView(projectId: projectId)) {
                    labelRow("exclamationmark.triangle", NSLocalizedString("mgr_issues", comment: ""))
                }
                .accessibilityIdentifier("pilot_manager_project_issues_link")
                NavigationLink(destination: ProjectAIView(projectId: projectId, projectName: p.name ?? NSLocalizedString("mgr_project", comment: ""))) {
                    labelRow("sparkles", NSLocalizedString("mgr_ai_jobs_link", comment: ""))
                }
                NavigationLink(destination: ProjectIntelligenceView(
                    projectId: projectId,
                    projectName: p.name ?? NSLocalizedString("mgr_project", comment: "")
                )) {
                    labelRow("chart.bar.doc.horizontal", NSLocalizedString("mgr_intelligence_link", comment: ""))
                }
                .accessibilityIdentifier("pilot_manager_project_intelligence_link")
                NavigationLink(destination: ProjectCopilotChatView(
                    projectId: projectId,
                    projectName: p.name ?? NSLocalizedString("mgr_project", comment: ""),
                    intelligence: intelligence
                )) {
                    labelRow("bubble.left.and.bubble.right", NSLocalizedString("mgr_copilot_link", comment: ""))
                }
                .accessibilityIdentifier("pilot_manager_project_copilot_link")
            }
            .padding(ManagerV43.screenX)
            .padding(.bottom, 24)
        }
        .background(ManagerV43.bg)
    }

    private func commandHeader(_ p: ProjectDetailDTO) -> some View {
        HStack {
            Text(p.name ?? projectName ?? "")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(ManagerV43.textPrimary)
            if ManagerV43Preview.isEnabled {
                ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_in_progress", comment: ""), kind: .success)
            }
            Spacer()
        }
    }

    @ViewBuilder
    private func timelineRow(_ item: ProjectTimelineItemDTO) -> some View {
        let entity = (item.entityType ?? "").lowercased()
        let entityId = item.entityId?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if entity == "report", !entityId.isEmpty {
            NavigationLink(destination: ReportDetailReviewView(reportId: entityId, projectName: project?.name ?? projectName)) {
                timelineRowContent(item)
            }
            .buttonStyle(.plain)
        } else if entity == "task", !entityId.isEmpty {
            NavigationLink(destination: TaskDetailManagerView(taskId: entityId)) {
                timelineRowContent(item)
            }
            .buttonStyle(.plain)
        } else if entity == "issue", !entityId.isEmpty {
            NavigationLink(destination: ProjectIssuesForProjectView(projectId: projectId, focusIssueId: entityId)) {
                timelineRowContent(item)
            }
            .buttonStyle(.plain)
        } else if entity == "document" {
            NavigationLink(destination: DocumentsHubView(initialProjectId: projectId)) {
                timelineRowContent(item)
            }
            .buttonStyle(.plain)
        } else {
            timelineRowContent(item)
        }
    }

    private func timelineRowContent(_ item: ProjectTimelineItemDTO) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(item.title ?? item.eventType ?? NSLocalizedString("mgr_v43_activity", comment: ""))
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .lineLimit(2)
                Spacer()
                if let occurred = ManagerV43Formatters.parseISODate(item.occurredAt) {
                    Text(ManagerV43Formatters.relativeTime(occurred))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                }
            }
            if let actor = item.actorLabel, !actor.isEmpty {
                Text(actor)
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
                    .lineLimit(1)
            } else if let description = item.description, !description.isEmpty {
                Text(description)
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
                    .lineLimit(2)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func labelRow(_ icon: String, _ title: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(ManagerV43.dataBlue)
            Text(title).foregroundStyle(ManagerV43.textPrimary)
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
        }
        .padding(12)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var displayedProgress: Double? {
        if let planned = estimate?.budgetSummary?.plannedTotal, planned > 0,
           let actual = estimate?.budgetSummary?.actualTotal {
            return ManagerV43Formatters.clampedProgress(actual / planned)
        }
        if ManagerV43Preview.isEnabled { return ManagerDemoCatalog.featuredProgress }
        let done = todayTasks.filter {
            let status = $0.status.lowercased()
            return status == "done" || status == "completed"
        }.count
        guard !todayTasks.isEmpty else { return nil }
        return Double(done) / Double(todayTasks.count)
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(item: project, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        if ManagerUITestLaunchHooks.isE2EEnabled {
            for _ in 0..<40 where await AuthService.shared.getAccessToken() == nil {
                try? await Task.sleep(nanoseconds: 250_000_000)
            }
            for _ in 0..<24 {
                do {
                    if try await ManagerAPI.me().data != nil { break }
                } catch {
                    try? await Task.sleep(nanoseconds: 500_000_000)
                }
            }
        }
        var lastLoadError: String?
        for attempt in 0..<(ManagerUITestLaunchHooks.isE2EEnabled ? 6 : 1) {
            if attempt > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            await runManagerLoad(
                setLoading: { isLoading = $0 },
                setErrorMessage: { errorMessage = $0 },
                previewFallback: {
                    project = ProjectDetailDTO(id: projectId, name: projectName ?? ManagerDemoCatalog.featuredProjectName, tenantId: nil, createdAt: nil)
                    todayTasks = ManagerDemoCatalog.tasks
                    timeline = []
                }
            ) {
                project = try await ManagerAPI.projectDetail(id: projectId)
                summary = try? await ManagerAPI.projectSummary(projectId: projectId)
                estimate = try? await ManagerAPI.projectEstimate(projectId: projectId)
                let day = ManagerV43Formatters.dayISO()
                todayTasks = (try? await ManagerAPI.tasks(projectId: projectId, from: day, to: day, limit: 8)) ?? []
                intelligence = try? await ManagerCopilotService.projectIntelligence(projectId: projectId)
                timeline = (try? await ManagerAPI.projectTimeline(projectId: projectId, limit: 12)) ?? []
            }
            if project != nil { return }
            lastLoadError = errorMessage
        }
        if project == nil, lastLoadError != nil {
            errorMessage = lastLoadError
        }
    }

    private func formatDate(_ s: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) ?? ISO8601DateFormatter().date(from: String(s.prefix(19)) + "Z") {
            return d.formatted(date: .abbreviated, time: .shortened)
        }
        return s
    }
}

/// Per-project AI jobs (GET /api/v1/projects/:id/ai).
struct ProjectAIView: View {
    let projectId: String
    let projectName: String
    @State private var jobs: [ProjectAIRowDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && jobs.isEmpty && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_ai_jobs", comment: ""))
            } else if let err = errorMessage, jobs.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if jobs.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_no_ai_jobs_title", comment: ""),
                    subtitle: NSLocalizedString("mgr_no_ai_jobs_project_subtitle", comment: "")
                )
            } else {
                List(Array(jobs.enumerated()), id: \.offset) { _, job in
                    ProjectAIRowView(job: job)
                }
                .aistroykaListChrome(
                    pageBackground: ManagerSemanticColors.pageBackground,
                    surfaceMuted: ManagerSemanticColors.surfaceMuted
                )
            }
        }
        .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
        .navigationTitle(String(format: NSLocalizedString("mgr_ai_project_title_fmt", comment: ""), projectName))
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: jobs, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            jobs = try await ManagerAPI.projectAi(projectId: projectId, limit: 50)
        }
    }
}

struct ProjectAIRowView: View {
    let job: ProjectAIRowDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(job.status ?? "—")
                .font(.subheadline)
            if let m = job.mediaId { Text(String(format: NSLocalizedString("mgr_media_fmt", comment: ""), m)).font(.caption).foregroundStyle(.secondary) }
            if let c = job.createdAt { Text(formatDate(c)).font(.caption2).foregroundStyle(.tertiary) }
        }
        .padding(.vertical, 4)
    }

    private func formatDate(_ s: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) ?? ISO8601DateFormatter().date(from: String(s.prefix(19)) + "Z") {
            return d.formatted(date: .abbreviated, time: .shortened)
        }
        return s
    }
}

/// Tasks list scoped to a project (pushed from project detail; no inner NavigationStack).
struct TasksListForProjectView: View {
    let projectId: String
    @State private var tasks: [TaskDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && tasks.isEmpty && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_tasks", comment: ""))
            } else if let err = errorMessage, tasks.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if tasks.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_no_tasks_title", comment: ""),
                    subtitle: NSLocalizedString("mgr_no_tasks_from_tab_subtitle", comment: "")
                )
            } else {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(tasks, id: \.id) { task in
                            NavigationLink(destination: TaskDetailManagerView(taskId: task.id)) {
                                TaskRowView(task: task)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(ManagerV43.screenX)
                    .padding(.bottom, 24)
                }
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_tab_tasks", comment: ""))
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
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
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            tasks = try await ManagerAPI.tasks(projectId: projectId, limit: 100)
        }
    }
}

struct ProjectIssuesForProjectView: View {
    let projectId: String
    var focusIssueId: String? = nil
    @State private var issues: [ManagerIssueDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var focusedIssue: ManagerIssueDTO?
    @State private var showCreate = false

    var body: some View {
        Group {
            if isLoading && issues.isEmpty && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_issues", comment: ""))
            } else if let err = errorMessage, issues.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if issues.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_no_issues_title", comment: ""),
                    subtitle: NSLocalizedString("mgr_no_issues_subtitle", comment: ""),
                    actionTitle: NSLocalizedString("mgr_v43_create_issue", comment: ""),
                    action: { showCreate = true }
                )
            } else {
                List(issues) { issue in
                    NavigationLink(destination: ManagerIssueDetailView(projectId: projectId, issue: issue)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(issue.title ?? issue.id)
                                .font(.subheadline)
                            Text(issue.status ?? "—")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if issue.evidenceUrl != nil || issue.evidenceUploadSessionId != nil {
                                Text(NSLocalizedString("mgr_issue_evidence", comment: ""))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .accessibilityIdentifier("pilot_manager_issue_\(issue.id)")
                }
                .aistroykaListChrome(
                    pageBackground: ManagerSemanticColors.pageBackground,
                    surfaceMuted: ManagerSemanticColors.surfaceMuted
                )
            }
        }
        .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
        .navigationTitle(NSLocalizedString("mgr_issues", comment: ""))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showCreate = true } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel(NSLocalizedString("mgr_v43_create_issue", comment: ""))
                .accessibilityIdentifier("pilot_manager_create_issue")
            }
        }
        .sheet(isPresented: $showCreate) {
            ManagerCreateIssueSheet(projectId: projectId) { created in
                issues.insert(created, at: 0)
                showCreate = false
            }
        }
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
        .background(
            NavigationLink(
                destination: Group {
                    if let focusedIssue {
                        ManagerIssueDetailView(projectId: projectId, issue: focusedIssue)
                    }
                },
                isActive: Binding(
                    get: { focusedIssue != nil },
                    set: { if !$0 { focusedIssue = nil } }
                )
            ) { EmptyView() }
            .hidden()
        )
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: issues, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 },
            previewFallback: { issues = [] }
        ) {
            issues = try await ManagerAPI.issues(projectId: projectId)
            if focusedIssue == nil, let focusIssueId {
                focusedIssue = issues.first(where: { $0.id == focusIssueId })
            }
        }
    }
}

struct ManagerCreateIssueSheet: View {
    let projectId: String
    var onCreated: (ManagerIssueDTO) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var description = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                TextField(NSLocalizedString("mgr_v43_issue_title_placeholder", comment: ""), text: $title)
                    .textInputAutocapitalization(.sentences)
                    .padding(12)
                    .frame(minHeight: ManagerV43.touch)
                    .background(ManagerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .accessibilityIdentifier("pilot_manager_create_issue_title")
                TextField(NSLocalizedString("mgr_v43_description_placeholder", comment: ""), text: $description, axis: .vertical)
                    .lineLimit(3...6)
                    .padding(12)
                    .background(ManagerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .accessibilityIdentifier("pilot_manager_create_issue_description")
                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(ManagerV43.danger)
                }
                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_create_issue", comment: ""),
                    enabled: !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSaving,
                    loading: isSaving
                ) {
                    Task { await create() }
                }
                .accessibilityIdentifier("pilot_manager_create_issue_submit")
                Spacer()
            }
            .padding(ManagerV43.screenX)
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("mgr_v43_create_issue", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("mgr_cancel", comment: "")) { dismiss() }
                        .accessibilityIdentifier("pilot_manager_create_issue_cancel")
                }
            }
        }
    }

    private func create() async {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let note = description.trimmingCharacters(in: .whitespacesAndNewlines)
        isSaving = true
        defer { isSaving = false }
        if ManagerV43Preview.isEnabled {
            onCreated(
                ManagerIssueDTO(
                    id: "preview-issue-\(UUID().uuidString)",
                    title: trimmed,
                    description: note.isEmpty ? nil : note,
                    status: "open",
                    createdAt: ISO8601DateFormatter().string(from: Date()),
                    evidenceUrl: nil,
                    evidenceUploadSessionId: nil
                )
            )
            return
        }
        do {
            let created = try await ManagerAPI.createIssue(
                projectId: projectId,
                title: trimmed,
                description: note.isEmpty ? nil : note,
                idempotencyKey: UUID().uuidString
            )
            onCreated(created)
        } catch let apiError as APIError {
            errorMessage = apiError.userFacingMessage
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ManagerIssueDetailView: View {
    let projectId: String
    @State private var issue: ManagerIssueDTO
    @State private var actionError: String?
    @State private var isSaving = false

    init(projectId: String, issue: ManagerIssueDTO) {
        self.projectId = projectId
        _issue = State(initialValue: issue)
    }

    private let statuses = ["open", "in_review", "resolved", "closed"]

    var body: some View {
        List {
            Section(NSLocalizedString("mgr_issues", comment: "")) {
                LabeledContent(NSLocalizedString("mgr_name", comment: ""), value: issue.title ?? issue.id)
                LabeledContent(NSLocalizedString("mgr_status", comment: ""), value: issue.status ?? "—")
                if let description = issue.description, !description.isEmpty {
                    Text(description)
                }
                if let created = issue.createdAt {
                    LabeledContent(NSLocalizedString("mgr_created", comment: ""), value: created)
                }
                if let urlString = issue.evidenceUrl, let url = URL(string: urlString) {
                    Link(NSLocalizedString("mgr_issue_evidence", comment: ""), destination: url)
                }
            }
            Section(NSLocalizedString("mgr_issue_status", comment: "")) {
                ForEach(statuses, id: \.self) { status in
                    Button(status) { patch(status) }
                        .disabled(isSaving || issue.status == status)
                        .accessibilityIdentifier("pilot_manager_issue_status_\(status)")
                }
                if let actionError {
                    Text(actionError)
                        .font(.caption)
                        .foregroundStyle(ManagerSemanticColors.error)
                }
            }
        }
        .aistroykaListChrome(
            pageBackground: ManagerSemanticColors.pageBackground,
            surfaceMuted: ManagerSemanticColors.surfaceMuted
        )
        .navigationTitle(issue.title ?? NSLocalizedString("mgr_issues", comment: ""))
    }

    private func patch(_ status: String) {
        isSaving = true
        actionError = nil
        Task {
            do {
                issue = try await ManagerAPI.patchIssueStatus(projectId: projectId, issueId: issue.id, status: status)
            } catch let apiError as APIError {
                actionError = apiError.message
            } catch {
                actionError = error.localizedDescription
            }
            isSaving = false
        }
    }
}
