//
//  ReportsInboxView.swift
//  AiStroyka Manager
//

import SwiftUI

struct ReportsInboxView: View {
    @State private var reports: [ReportListItemDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && reports.isEmpty && errorMessage == nil {
                    LoadingStateView(message: "Loading reports…")
                } else if let err = errorMessage, reports.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if reports.isEmpty {
                    EmptyStateView(title: "No reports", subtitle: "Field reports will appear here.")
                } else {
                    listContent
                }
            }
            .navigationTitle("Reports")
            .refreshable { await loadAsync() }
            .onAppear { load() }
        }
    }

    private var listContent: some View {
        VStack(spacing: 0) {
            if !projects.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: "All", selected: selectedProjectId == nil) { selectedProjectId = nil; load() }
                        ForEach(projects, id: \.id) { p in
                            FilterChip(title: p.name ?? p.id, selected: selectedProjectId == p.id) {
                                selectedProjectId = p.id
                                load()
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                .background(Color(.secondarySystemGroupedBackground))
            }
            List(reports, id: \.id) { r in
                NavigationLink(destination: ReportDetailReviewView(reportId: r.id)) {
                    ReportRowView(report: r)
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
            async let reportsTask = ManagerAPI.reports(projectId: selectedProjectId, limit: 100)
            async let projectsTask = ManagerAPI.projects()
            reports = try await reportsTask
            projects = try await projectsTask
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct ReportRowView: View {
    let report: ReportListItemDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(report.id)
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Text(statusLabel(report.status ?? ""))
                    .font(.subheadline)
                Spacer()
                if let n = report.mediaCount, n > 0 {
                    Text("\(n) photo(s)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            if let a = report.analysisStatus, !a.isEmpty {
                Text("Analysis: \(a)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func statusLabel(_ s: String) -> String {
        if s.isEmpty { return "Unknown" }
        return s.prefix(1).uppercased() + s.dropFirst().lowercased()
    }
}

struct ReportDetailReviewView: View {
    let reportId: String
    @State private var report: ReportDetailDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && report == nil && errorMessage == nil {
                LoadingStateView(message: "Loading report…")
            } else if let err = errorMessage, report == nil {
                ErrorStateView(message: err, retry: load)
            } else if let r = report {
                List {
                    Section("Report") {
                        LabeledContent("ID", value: r.id ?? reportId)
                        LabeledContent("Status", value: r.status ?? "—")
                        if let c = r.createdAt { LabeledContent("Created", value: formatDate(c)) }
                        if let s = r.submittedAt { LabeledContent("Submitted", value: formatDate(s)) }
                    }
                    if let media = r.media, !media.isEmpty {
                        Section("Media (\(media.count))") {
                            ForEach(Array(media.enumerated()), id: \.offset) { _, m in
                                HStack {
                                    Text("Item \(m.mediaId ?? m.uploadSessionId ?? "?")")
                                        .font(.caption)
                                }
                            }
                        }
                    }
                }
            } else {
                EmptyStateView(title: "Report not found", subtitle: nil)
            }
        }
        .navigationTitle("Report")
        .onAppear { load() }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task {
            defer { isLoading = false }
            do {
                report = try await ManagerAPI.reportDetail(id: reportId)
            } catch let e as APIError {
                errorMessage = e.message
            } catch {
                errorMessage = error.localizedDescription
            }
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

/// Reusable filter chip for project/status filters.
struct FilterChip: View {
    let title: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(selected ? Color.accentColor : Color(.tertiarySystemFill))
                .foregroundColor(selected ? .white : .primary)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
