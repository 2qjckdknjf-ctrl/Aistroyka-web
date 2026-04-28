//
//  ReportsInboxView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct ReportsInboxView: View {
    var initialProjectId: String? = nil
    @State private var reports: [ReportListItemDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && reports.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_reports", comment: ""))
                } else if let err = errorMessage, reports.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if reports.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_reports_title", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_reports_subtitle", comment: "")
                    )
                } else {
                    listContent
                }
            }
            .navigationTitle(NSLocalizedString("mgr_tab_reports", comment: ""))
            .refreshable { await loadAsync() }
            .onAppear {
                if let id = initialProjectId, selectedProjectId == nil { selectedProjectId = id }
                loadIfNeeded()
            }
        }
    }

    private var listContent: some View {
        VStack(spacing: 0) {
            if !projects.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(title: NSLocalizedString("mgr_all", comment: ""), selected: selectedProjectId == nil) { selectedProjectId = nil; load() }
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

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: reports, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
            async let reportsTask = ManagerAPI.reports(projectId: selectedProjectId, limit: 100)
            async let projectsTask = ManagerAPI.projects()
            reports = try await reportsTask
            projects = try await projectsTask
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
                    Text(String(format: NSLocalizedString("mgr_photos_count_fmt", comment: ""), n))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            if let a = report.analysisStatus, !a.isEmpty {
                Text(String(format: NSLocalizedString("mgr_analysis_fmt", comment: ""), a))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func statusLabel(_ s: String) -> String {
        if s.isEmpty { return NSLocalizedString("mgr_unknown", comment: "") }
        return s.prefix(1).uppercased() + s.dropFirst().lowercased()
    }
}

struct ReportDetailReviewView: View {
    let reportId: String
    @State private var report: ReportDetailDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var reviewActionLoading = false
    @State private var reviewActionError: String?
    @State private var managerNoteText = ""

    var body: some View {
        Group {
            if isLoading && report == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_report", comment: ""))
            } else if let err = errorMessage, report == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let r = report {
                List {
                    Section(NSLocalizedString("mgr_report_section", comment: "")) {
                        LabeledContent(NSLocalizedString("mgr_id", comment: ""), value: r.id ?? reportId)
                        LabeledContent(NSLocalizedString("mgr_status", comment: ""), value: statusLabel(r.status ?? ""))
                        if let c = r.createdAt { LabeledContent(NSLocalizedString("mgr_created", comment: ""), value: formatDate(c)) }
                        if let s = r.submittedAt { LabeledContent(NSLocalizedString("mgr_submitted", comment: ""), value: formatDate(s)) }
                        if let ra = r.reviewedAt { LabeledContent(NSLocalizedString("mgr_reviewed_at", comment: ""), value: formatDate(ra)) }
                        if let note = r.managerNote, !note.isEmpty {
                            LabeledContent(NSLocalizedString("mgr_manager_note", comment: ""), value: note)
                        }
                    }
                    if let media = r.media, !media.isEmpty {
                        Section(String(format: NSLocalizedString("mgr_media_count_fmt", comment: ""), media.count)) {
                            ForEach(Array(media.enumerated()), id: \.offset) { _, m in
                                HStack {
                                    Text(String(format: NSLocalizedString("mgr_item_fmt", comment: ""), m.mediaId ?? m.uploadSessionId ?? "?"))
                                        .font(.caption)
                                }
                            }
                        }
                    }
                    if r.status?.lowercased() == "submitted" {
                        Section(NSLocalizedString("mgr_review_actions_section", comment: "")) {
                            if reviewActionLoading {
                                HStack {
                                    ProgressView()
                                    Text(NSLocalizedString("mgr_submitting", comment: ""))
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            if let err = reviewActionError {
                                Text(err)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                            TextField(NSLocalizedString("mgr_note_optional", comment: ""), text: $managerNoteText, axis: .vertical)
                                .lineLimit(2...4)
                                .disabled(reviewActionLoading)
                            Button(NSLocalizedString("mgr_approve", comment: "")) { submitReview(status: "approved") }
                                .disabled(reviewActionLoading)
                            Button(NSLocalizedString("mgr_mark_reviewed", comment: "")) { submitReview(status: "reviewed") }
                                .disabled(reviewActionLoading)
                            Button(NSLocalizedString("mgr_request_changes", comment: "")) { submitReview(status: "changes_requested") }
                                .disabled(reviewActionLoading)
                        }
                    } else if !isReviewStatus(r.status) {
                        Section(NSLocalizedString("mgr_review_section", comment: "")) {
                            Text(NSLocalizedString("mgr_report_not_submitted", comment: ""))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .refreshable { await loadAsync() }
            } else {
                EmptyStateView(title: NSLocalizedString("mgr_report_not_found", comment: ""), subtitle: nil)
            }
        }
        .navigationTitle(NSLocalizedString("mgr_report", comment: ""))
        .onAppear { loadIfNeeded() }
    }

    private func isReviewStatus(_ s: String?) -> Bool {
        guard let s = s?.lowercased() else { return false }
        return s == "approved" || s == "reviewed" || s == "changes_requested"
    }

    private func statusLabel(_ s: String) -> String {
        if s.isEmpty { return "—" }
        return s.prefix(1).uppercased() + s.dropFirst().lowercased().replacingOccurrences(of: "_", with: " ")
    }

    private func submitReview(status: String) {
        Task {
            let success = await runManagerAction(
                isLoading: &reviewActionLoading,
                errorMessage: &reviewActionError
            ) {
                let note = managerNoteText.trimmingCharacters(in: .whitespacesAndNewlines)
                report = try await ManagerAPI.reportReview(reportId: reportId, status: status, managerNote: note.isEmpty ? nil : note)
            }
            if success {
                managerNoteText = ""
            }
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(item: report, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
            report = try await ManagerAPI.reportDetail(id: reportId)
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
