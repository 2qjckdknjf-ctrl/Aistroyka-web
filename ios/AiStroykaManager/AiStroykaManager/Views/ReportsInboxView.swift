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
    @State private var loadGeneration = 0

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
            .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
            .navigationTitle(NSLocalizedString("mgr_tab_reports", comment: ""))
            .refreshable { await refreshAsync() }
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
                        FilterChip(title: NSLocalizedString("mgr_all", comment: ""), selected: selectedProjectId == nil) { selectProjectFilter(nil) }
                        ForEach(projects, id: \.id) { p in
                            FilterChip(title: p.name ?? p.id, selected: selectedProjectId == p.id) {
                                selectProjectFilter(p.id)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                .background(ManagerSemanticColors.surfaceMuted)
            }
            List(reports, id: \.id) { r in
                NavigationLink(destination: ReportDetailReviewView(reportId: r.id)) {
                    ReportRowView(report: r)
                }
                .accessibilityIdentifier("pilot_manager_report_\(r.id)")
                .aistroykaRowChrome()
            }
            .aistroykaListChrome(
                pageBackground: ManagerSemanticColors.pageBackground,
                surfaceMuted: ManagerSemanticColors.surfaceMuted
            )
        }
    }

    @MainActor
    private func selectProjectFilter(_ projectId: String?) {
        guard selectedProjectId != projectId else { return }
        selectedProjectId = projectId
        load(clearReports: true)
    }

    @MainActor
    private func load(clearReports: Bool = false) {
        errorMessage = nil
        isLoading = true
        if clearReports { reports = [] }
        loadGeneration += 1
        let generation = loadGeneration
        let projectId = selectedProjectId
        Task { await loadAsync(generation: generation, projectId: projectId) }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: reports, errorMessage: errorMessage) else { return }
        load()
    }

    @MainActor
    private func refreshAsync() async {
        loadGeneration += 1
        let generation = loadGeneration
        await loadAsync(generation: generation, projectId: selectedProjectId)
    }

    @MainActor
    private func loadAsync(generation: Int, projectId: String?) async {
        await runManagerLoad(
            setLoading: { if generation == loadGeneration { isLoading = $0 } },
            setErrorMessage: { if generation == loadGeneration { errorMessage = $0 } }
        ) {
            async let reportsTask = ManagerAPI.reports(projectId: projectId, limit: 100)
            async let projectsTask = ManagerAPI.projects()
            let loadedReports = try await reportsTask
            let loadedProjects = try await projectsTask
            guard generation == loadGeneration else { return }
            reports = loadedReports
            projects = loadedProjects
        }
    }
}

struct ReportRowView: View {
    let report: ReportListItemDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(shortReportId(report.id))
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

    private func shortReportId(_ id: String) -> String {
        guard id.count > 10 else { return id }
        return String(id.prefix(8)) + "…"
    }

    private func statusLabel(_ s: String) -> String {
        if s.isEmpty { return NSLocalizedString("mgr_unknown", comment: "") }
        return s.prefix(1).uppercased() + s.dropFirst().lowercased().replacingOccurrences(of: "_", with: " ")
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
                        if let wnote = r.workerNote, !wnote.isEmpty {
                            LabeledContent(NSLocalizedString("mgr_worker_note", comment: ""), value: wnote)
                        }
                    }
                    .aistroykaRowChrome()
                    if let media = r.media, !media.isEmpty {
                        Section(String(format: NSLocalizedString("mgr_media_count_fmt", comment: ""), media.count)) {
                            ForEach(Array(media.enumerated()), id: \.offset) { idx, m in
                                ReportEvidenceItemView(index: idx + 1, item: m)
                            }
                        }
                        .aistroykaRowChrome()
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
                                    .foregroundStyle(ManagerSemanticColors.error)
                            }
                            TextField(NSLocalizedString("mgr_report_review_note_label", comment: ""), text: $managerNoteText, axis: .vertical)
                                .lineLimit(2...4)
                                .disabled(reviewActionLoading)
                                .accessibilityIdentifier("pilot_manager_review_note")
                            Button(NSLocalizedString("mgr_approve", comment: "")) { submitReview(status: "approved") }
                                .disabled(reviewActionLoading)
                                .accessibilityIdentifier("pilot_manager_review_approve")
                            Button(NSLocalizedString("mgr_request_changes", comment: "")) { submitReview(status: "changes_requested") }
                                .disabled(reviewActionLoading)
                                .accessibilityIdentifier("pilot_manager_review_request_changes")
                            Button(NSLocalizedString("mgr_reject", comment: ""), role: .destructive) { submitReview(status: "rejected") }
                                .disabled(reviewActionLoading)
                                .accessibilityIdentifier("pilot_manager_review_reject")
                        }
                        .aistroykaRowChrome()
                    } else if !isReviewStatus(r.status) {
                        Section(NSLocalizedString("mgr_review_section", comment: "")) {
                            Text(NSLocalizedString("mgr_report_not_submitted", comment: ""))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .aistroykaRowChrome()
                    }
                }
                .aistroykaListChrome(
                    pageBackground: ManagerSemanticColors.pageBackground,
                    surfaceMuted: ManagerSemanticColors.surfaceMuted
                )
                .onChange(of: managerNoteText) { _ in
                    if reviewActionError != nil { reviewActionError = nil }
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
        return s == "approved" || s == "rejected" || s == "changes_requested"
    }

    private func statusLabel(_ s: String) -> String {
        if s.isEmpty { return "—" }
        return s.prefix(1).uppercased() + s.dropFirst().lowercased().replacingOccurrences(of: "_", with: " ")
    }

    private func submitReview(status: String) {
        let note = managerNoteText.trimmingCharacters(in: .whitespacesAndNewlines)
        if status == "rejected" || status == "changes_requested" {
            if note.isEmpty {
                reviewActionError = NSLocalizedString("mgr_note_required_reject_or_changes", comment: "")
                return
            }
        }
        reviewActionError = nil
        Task {
            let success = await runManagerAction(
                setLoading: { reviewActionLoading = $0 },
                setErrorMessage: { reviewActionError = $0 }
            ) {
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
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
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

private struct ReportEvidenceItemView: View {
    let index: Int
    let item: ReportMediaItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let urlStr = item.fileUrl, let url = URL(string: urlStr), !urlStr.isEmpty {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 120)
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 240)
                            .cornerRadius(8)
                    case .failure:
                        Text(String(format: NSLocalizedString("mgr_evidence_load_failed_fmt", comment: ""), index))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    @unknown default:
                        EmptyView()
                    }
                }
            } else {
                Text(String(format: NSLocalizedString("mgr_evidence_no_preview_fmt", comment: ""), index, evidenceShortId))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var evidenceShortId: String {
        let raw = item.mediaId ?? item.uploadSessionId ?? "—"
        guard raw.count > 10 else { return raw }
        return String(raw.prefix(8)) + "…"
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
                .background(selected ? Color.accentColor : ManagerSemanticColors.filterUnselected)
                .foregroundColor(selected ? ManagerSemanticColors.onPrimary : .primary)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
