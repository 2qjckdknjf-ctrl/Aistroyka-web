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
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && project == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_project", comment: ""))
            } else if let err = errorMessage, project == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let p = project {
                content(project: p)
            } else {
                EmptyStateView(title: NSLocalizedString("mgr_project_not_found", comment: ""), subtitle: nil)
            }
        }
        .accessibilityIdentifier("pilot_manager_project_detail_e2e")
        .navigationTitle(project?.name ?? projectName ?? NSLocalizedString("mgr_project", comment: ""))
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
    }

    private func content(project p: ProjectDetailDTO) -> some View {
        List {
            Section(NSLocalizedString("mgr_project_section", comment: "")) {
                LabeledContent(NSLocalizedString("mgr_name", comment: ""), value: p.name ?? "—")
                LabeledContent(NSLocalizedString("mgr_id", comment: ""), value: p.id)
                if let c = p.createdAt { LabeledContent(NSLocalizedString("mgr_created", comment: ""), value: formatDate(c)) }
            }
            if let s = summary {
                Section(NSLocalizedString("mgr_summary_section", comment: "")) {
                    if let n = s.activeWorkers { LabeledContent(NSLocalizedString("mgr_active_workers", comment: ""), value: "\(n)") }
                    if let n = s.openReports { LabeledContent(NSLocalizedString("mgr_open_reports", comment: ""), value: "\(n)") }
                    if let n = s.aiAnalyses { LabeledContent(NSLocalizedString("mgr_ai_analyses", comment: ""), value: "\(n)") }
                }
            }
            Section(NSLocalizedString("mgr_quick_links_section", comment: "")) {
                NavigationLink(destination: TasksListForProjectView(projectId: projectId)) {
                    Label(NSLocalizedString("mgr_tab_tasks", comment: ""), systemImage: "checklist")
                }
                NavigationLink(destination: ReportsInboxForProjectView(projectId: projectId)) {
                    Label(NSLocalizedString("mgr_tab_reports", comment: ""), systemImage: "doc.text")
                }
                NavigationLink(destination: ProjectAIView(projectId: projectId, projectName: p.name ?? NSLocalizedString("mgr_project", comment: ""))) {
                    Label(NSLocalizedString("mgr_ai_jobs_link", comment: ""), systemImage: "sparkles")
                }
                NavigationLink(destination: ProjectIntelligenceView(
                    projectId: projectId,
                    projectName: p.name ?? NSLocalizedString("mgr_project", comment: "")
                )) {
                    Label(NSLocalizedString("mgr_intelligence_link", comment: ""), systemImage: "chart.bar.doc.horizontal")
                }
                .accessibilityIdentifier("pilot_manager_project_intelligence_link")
                NavigationLink(destination: ProjectCopilotChatView(
                    projectId: projectId,
                    projectName: p.name ?? NSLocalizedString("mgr_project", comment: ""),
                    intelligence: nil
                )) {
                    Label(NSLocalizedString("mgr_copilot_link", comment: ""), systemImage: "bubble.left.and.bubble.right")
                }
                .accessibilityIdentifier("pilot_manager_project_copilot_link")
            }
        }
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
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            async let projectTask = ManagerAPI.projectDetail(id: projectId)
            async let summaryTask = ManagerAPI.projectSummary(projectId: projectId)
            project = try await projectTask
            summary = try await summaryTask
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
            }
        }
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
                List(tasks, id: \.id) { t in
                    NavigationLink(destination: TaskDetailManagerView(taskId: t.id)) {
                        TaskRowView(task: t)
                    }
                }
            }
        }
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

/// Reports list scoped to a project (pushed from project detail; no inner NavigationStack).
struct ReportsInboxForProjectView: View {
    let projectId: String
    @State private var reports: [ReportListItemDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && reports.isEmpty && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_reports", comment: ""))
            } else if let err = errorMessage, reports.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if reports.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_no_reports_title", comment: ""),
                    subtitle: NSLocalizedString("mgr_no_reports_project_subtitle", comment: "")
                )
            } else {
                List(reports, id: \.id) { r in
                    NavigationLink(destination: ReportDetailReviewView(reportId: r.id)) {
                        ReportRowView(report: r)
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("mgr_tab_reports", comment: ""))
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: reports, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            reports = try await ManagerAPI.reports(projectId: projectId, limit: 100)
        }
    }
}
