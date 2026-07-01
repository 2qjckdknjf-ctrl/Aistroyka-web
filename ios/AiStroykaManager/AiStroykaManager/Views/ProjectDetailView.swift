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
                LoadingStateView(message: "Loading project…")
            } else if let err = errorMessage, project == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let p = project {
                content(project: p)
            } else {
                EmptyStateView(title: "Project not found", subtitle: nil)
            }
        }
        .navigationTitle(project?.name ?? projectName ?? "Project")
        .refreshable { await loadAsync() }
        .onAppear { load() }
    }

    private func content(project p: ProjectDetailDTO) -> some View {
        List {
            Section("Project") {
                LabeledContent("Name", value: p.name ?? "—")
                LabeledContent("ID", value: p.id)
                if let c = p.createdAt { LabeledContent("Created", value: formatDate(c)) }
            }
            if let s = summary {
                Section("Summary") {
                    if let n = s.activeWorkers { LabeledContent("Active workers", value: "\(n)") }
                    if let n = s.openReports { LabeledContent("Open reports", value: "\(n)") }
                    if let n = s.aiAnalyses { LabeledContent("AI analyses", value: "\(n)") }
                }
            }
            Section("Quick links") {
                NavigationLink(destination: TasksListForProjectView(projectId: projectId)) {
                    Label("Tasks", systemImage: "checklist")
                }
                NavigationLink(destination: ReportsInboxForProjectView(projectId: projectId)) {
                    Label("Reports", systemImage: "doc.text")
                }
                NavigationLink(destination: ProjectAIView(projectId: projectId, projectName: p.name ?? "Project")) {
                    Label("AI", systemImage: "sparkles")
                }
            }
        }
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
            async let projectTask = ManagerAPI.projectDetail(id: projectId)
            async let summaryTask = ManagerAPI.projectSummary(projectId: projectId)
            project = try await projectTask
            summary = try await summaryTask
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
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
                LoadingStateView(message: "Loading AI jobs…")
            } else if let err = errorMessage, jobs.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if jobs.isEmpty {
                EmptyStateView(title: "No AI jobs", subtitle: "Analysis jobs for this project will appear here.")
            } else {
                List(Array(jobs.enumerated()), id: \.offset) { _, job in
                    ProjectAIRowView(job: job)
                }
            }
        }
        .navigationTitle("AI — \(projectName)")
        .refreshable { await loadAsync() }
        .onAppear { load() }
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
            jobs = try await ManagerAPI.projectAi(projectId: projectId, limit: 50)
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ProjectAIRowView: View {
    let job: ProjectAIRowDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(job.status ?? "—")
                .font(.subheadline)
            if let m = job.mediaId { Text("Media: \(m)").font(.caption).foregroundStyle(.secondary) }
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
                LoadingStateView(message: "Loading tasks…")
            } else if let err = errorMessage, tasks.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if tasks.isEmpty {
                EmptyStateView(title: "No tasks", subtitle: "Create tasks from the Tasks tab.")
            } else {
                List(tasks, id: \.id) { t in
                    NavigationLink(destination: TaskDetailManagerView(taskId: t.id)) {
                        TaskRowView(task: t)
                    }
                }
            }
        }
        .navigationTitle("Tasks")
        .refreshable { await loadAsync() }
        .onAppear { load() }
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
            tasks = try await ManagerAPI.tasks(projectId: projectId, limit: 100)
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
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
                LoadingStateView(message: "Loading reports…")
            } else if let err = errorMessage, reports.isEmpty {
                ErrorStateView(message: err, retry: { load() })
            } else if reports.isEmpty {
                EmptyStateView(title: "No reports", subtitle: "Field reports for this project will appear here.")
            } else {
                List(reports, id: \.id) { r in
                    NavigationLink(destination: ReportDetailReviewView(reportId: r.id)) {
                        ReportRowView(report: r)
                    }
                }
            }
        }
        .navigationTitle("Reports")
        .refreshable { await loadAsync() }
        .onAppear { load() }
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
            reports = try await ManagerAPI.reports(projectId: projectId, limit: 100)
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
