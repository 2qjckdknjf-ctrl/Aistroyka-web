//
//  ReportsInboxView.swift
//  AiStroyka Manager
//

import SwiftUI
import UIKit
import Shared

struct ReportsInboxView: View {
    var initialProjectId: String? = nil
    @StateObject private var network = NetworkMonitor.shared
    @State private var reports: [ReportListItemDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var queueFilter = "review"
    @State private var onlyToday = false
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var loadGeneration = 0
    @State private var lastSync: Date?
    @State private var showingShare = false

    private let cacheKey = "mgr.v43.reports"

    var body: some View {
        Group {
            if isLoading && reports.isEmpty && errorMessage == nil {
                ScrollView {
                    VStack(spacing: 12) {
                        ManagerSkeletonBlock(height: 72)
                        ManagerSkeletonBlock(height: 120)
                        ManagerSkeletonBlock(height: 110)
                    }
                    .padding(ManagerV43.screenX)
                }
            } else if let err = errorMessage, reports.isEmpty, !ManagerV43Formatters.isPermissionDenied(err) {
                ErrorStateView(message: err, retry: { load() })
            } else if let err = errorMessage, ManagerV43Formatters.isPermissionDenied(err), reports.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_v43_permission_denied", comment: ""),
                    subtitle: err
                )
            } else {
                content
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_tab_reports", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await refreshAsync() }
        .onAppear {
            if let id = initialProjectId, selectedProjectId == nil { selectedProjectId = id }
            if reports.isEmpty, let cached = ManagerCacheStore.load([ReportListItemDTO].self, key: cacheKey) {
                reports = cached
                lastSync = ManagerCacheStore.lastSync(key: cacheKey)
            }
            loadIfNeeded()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.reportsChanged)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
        .sheet(isPresented: $showingShare) {
            ShareSheet(items: [shareText])
        }
    }

    private var filtered: [ReportListItemDTO] {
        reports.filter { report in
            let bucket = ManagerV43Formatters.reportQueueBucket(from: report.status)
            let matchesQueue = queueFilter == "all" || bucket == queueFilter || (queueFilter == "review" && bucket == "returned")
            return matchesQueue && matchesProjectAndDay(report)
        }
    }

    private var averageReviewLabel: String? {
        nil
    }

    private var reviewCount: Int {
        reports.filter { report in
            ManagerV43Formatters.reportQueueBucket(from: report.status) == "review"
                && matchesProjectAndDay(report)
        }.count
    }

    private func matchesProjectAndDay(_ report: ReportListItemDTO) -> Bool {
        let matchesProject = selectedProjectId == nil || report.projectId == selectedProjectId
        let matchesDay = !onlyToday || ManagerV43Formatters.dayGroup(createdAt: report.createdAt) == "today"
        return matchesProject && matchesDay
    }

    private var aiRemarkCount: Int {
        reports.filter { ManagerV43Formatters.reportHasAIRemarks(analysisStatus: $0.analysisStatus) }.count
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if !network.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                } else if let err = errorMessage {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                        .overlay(alignment: .bottomLeading) {
                            Text(err).font(.caption2).foregroundStyle(ManagerV43.danger).padding(.leading, 40).padding(.bottom, 6)
                        }
                }

                HStack(spacing: 8) {
                    queueChip("review", String(format: NSLocalizedString("mgr_v43_review_queue_fmt", comment: ""), reviewCount))
                    queueChip("approved", NSLocalizedString("mgr_v43_approved", comment: ""))
                    queueChip("all", NSLocalizedString("mgr_all", comment: ""))
                }

                HStack(spacing: 8) {
                    Menu {
                        Button(NSLocalizedString("mgr_v43_all_projects", comment: "")) { selectedProjectId = nil }
                        ForEach(projects, id: \.id) { project in
                            Button(project.name ?? project.id) { selectedProjectId = project.id }
                        }
                    } label: {
                        filterMenuLabel(
                            "building.2",
                            selectedProjectId.flatMap { id in projects.first(where: { $0.id == id })?.name } ?? NSLocalizedString("mgr_v43_all_projects", comment: "")
                        )
                    }
                    Button {
                        onlyToday.toggle()
                    } label: {
                        filterMenuLabel("calendar", onlyToday ? NSLocalizedString("mgr_v43_today", comment: "") : NSLocalizedString("mgr_all", comment: ""))
                    }
                    .buttonStyle(.plain)
                }

                ManagerV43Card {
                    HStack(spacing: 12) {
                        Image(systemName: "doc.text.image")
                            .foregroundStyle(ManagerV43.yellowInk)
                            .frame(width: 36, height: 36)
                            .background(ManagerV43.yellow)
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(reviewCount)")
                                .font(.system(size: 28, weight: .semibold))
                                .foregroundStyle(ManagerV43.textPrimary)
                            Text(NSLocalizedString("mgr_v43_reports_waiting", comment: ""))
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                        Spacer()
                        VStack(alignment: .leading, spacing: 10) {
                            if let avg = averageReviewLabel {
                                HStack(spacing: 6) {
                                    Image(systemName: "clock").foregroundStyle(ManagerV43.dataBlue)
                                    Text(avg)
                                        .font(.caption2)
                                        .foregroundStyle(ManagerV43.textSecondary)
                                }
                            }
                            HStack(spacing: 6) {
                                ManagerAIBadge(size: 18)
                                Text(String(format: NSLocalizedString("mgr_v43_ai_remarks_fmt", comment: ""), aiRemarkCount))
                                    .font(.caption2)
                                    .foregroundStyle(ManagerV43.textSecondary)
                            }
                        }
                    }
                }

                if filtered.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_reports_title", comment: ""),
                        subtitle: onlyToday && !reports.isEmpty
                            ? NSLocalizedString("mgr_v43_no_reports_today", comment: "")
                            : NSLocalizedString("mgr_no_reports_subtitle", comment: "")
                    )
                    .frame(minHeight: 180)
                } else {
                    ForEach(filtered, id: \.id) { report in
                        NavigationLink(destination: ReportDetailReviewView(reportId: report.id, projectName: projectName(for: report))) {
                            ReportCanonCard(report: report, projectName: projectName(for: report))
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("pilot_manager_report_\(report.id)")
                    }
                }

                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_share_queue", comment: ""),
                    systemImage: "square.and.arrow.up"
                ) { showingShare = true }
            }
            .padding(.horizontal, ManagerV43.screenX)
            .padding(.bottom, 24)
        }
    }

    private func queueChip(_ id: String, _ title: String) -> some View {
        ManagerV43Chip(title: title, selected: queueFilter == id) {
            withAnimation(.easeInOut(duration: ManagerV43.motion)) { queueFilter = id }
        }
    }

    private func filterMenuLabel(_ icon: String, _ title: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(ManagerV43.dataBlue)
            Text(title)
                .lineLimit(1)
                .foregroundStyle(ManagerV43.textPrimary)
            Spacer()
            Image(systemName: "chevron.down").font(.caption).foregroundStyle(ManagerV43.textSecondary)
        }
        .padding(.horizontal, 12)
        .frame(minHeight: ManagerV43.touch)
        .background(ManagerV43.card)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func projectName(for report: ReportListItemDTO) -> String {
        if let id = report.projectId, let name = projects.first(where: { $0.id == id })?.name, !name.isEmpty {
            return name
        }
        if let id = report.projectId, !id.isEmpty {
            return ManagerV43Formatters.shortIdentifier(id)
        }
        if let taskId = report.taskId, !taskId.isEmpty {
            return String(format: NSLocalizedString("mgr_v43_report_task_fmt", comment: ""), ManagerV43Formatters.shortIdentifier(taskId))
        }
        return ManagerV43Formatters.shortIdentifier(report.id)
    }

    private var shareText: String {
        let lines = filtered.map { report in
            "\(ManagerV43Formatters.shortIdentifier(report.id)) · \(report.status ?? "—") · \(projectName(for: report))"
        }
        return ([NSLocalizedString("mgr_v43_share_queue", comment: "")] + lines).joined(separator: "\n")
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
        if errorMessage != nil { return }
        if reports.isEmpty || projects.isEmpty {
            load()
        }
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
            setErrorMessage: { if generation == loadGeneration { errorMessage = $0 } },
            previewFallback: {
                reports = ManagerDemoCatalog.reports
                projects = ManagerDemoCatalog.projects
                lastSync = Date()
            }
        ) {
            async let reportsTask = ManagerAPI.reports(projectId: projectId, limit: 100)
            async let projectsTask = ManagerAPI.projects()
            let loadedReports = try await reportsTask
            let loadedProjects = try await projectsTask
            guard generation == loadGeneration else { return }
            reports = loadedReports
            projects = loadedProjects
            ManagerCacheStore.save(loadedReports, key: cacheKey)
            lastSync = Date()
        }
    }
}

struct ReportCanonCard: View {
    let report: ReportListItemDTO
    let projectName: String

    var body: some View {
        ManagerV43Card {
            HStack(alignment: .top, spacing: 12) {
                if ManagerV43Preview.isEnabled {
                    Image("DemoRebar")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 72, height: 72)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .accessibilityHidden(true)
                } else {
                    Image(systemName: "doc.text.fill")
                        .font(.title2)
                        .foregroundStyle(ManagerV43.dataBlue)
                        .frame(width: 72, height: 72)
                        .background(ManagerV43.cardStrong)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .accessibilityHidden(true)
                }
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(projectName)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(ManagerV43.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
                    }
                    Text(ManagerV43Formatters.shortIdentifier(report.id))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                    HStack(spacing: 8) {
                        if let created = ManagerV43Formatters.parseISODate(report.createdAt) {
                            Text(ManagerV43Formatters.relativeTime(created))
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                        ManagerV43StatusPill(
                            text: String(format: NSLocalizedString("mgr_v43_photos_fmt", comment: ""), report.mediaCount ?? 0),
                            kind: .info
                        )
                    }
                    statusChip
                }
            }
        }
    }

    @ViewBuilder
    private var statusChip: some View {
        if ManagerV43Formatters.reportHasAIRemarks(analysisStatus: report.analysisStatus) {
            ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_ai_possible_deviation", comment: ""), kind: .ai)
        } else if ManagerV43Formatters.reportQueueBucket(from: report.status) == "returned" {
            ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_docs_needed", comment: ""), kind: .warning)
        } else {
            ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_no_remarks", comment: ""), kind: .success)
        }
    }
}

struct ReportDetailReviewView: View {
    let reportId: String
    var projectName: String? = nil
    @State private var report: ReportDetailDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var reviewActionLoading = false
    @State private var reviewActionError: String?
    @State private var managerNoteText = ""
    @State private var selectedMedia = 0
    @State private var zoomURL: URL?
    @State private var analysis: ReportAnalysisStatusDTO?
    @State private var approvalHistory: [ReportApprovalEventDTO] = []

    var body: some View {
        Group {
            if isLoading && report == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_report", comment: ""))
            } else if let err = errorMessage, report == nil {
                if ManagerV43Formatters.isPermissionDenied(err) {
                    EmptyStateView(title: NSLocalizedString("mgr_v43_permission_denied", comment: ""), subtitle: err)
                } else {
                    ErrorStateView(message: err, retry: { load() })
                }
            } else if let r = report {
                detail(r)
            } else {
                EmptyStateView(title: NSLocalizedString("mgr_report_not_found", comment: ""), subtitle: nil)
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(navigationTitle)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { loadIfNeeded() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.reportsChanged)) { _ in
            load()
        }
        .fullScreenCover(item: Binding(
            get: { zoomURL.map { IdentifiedURL(url: $0) } },
            set: { zoomURL = $0?.url }
        )) { item in
            ZStack(alignment: .topTrailing) {
                Color.black.ignoresSafeArea()
                AsyncImage(url: item.url) { phase in
                    if case .success(let image) = phase {
                        image.resizable().scaledToFit()
                    } else {
                        ProgressView()
                    }
                }
                Button { zoomURL = nil } label: {
                    Image(systemName: "xmark.circle.fill").font(.title).foregroundStyle(.white)
                }
                .padding()
                .accessibilityLabel(NSLocalizedString("mgr_close", comment: ""))
            }
        }
    }

    private var navigationTitle: String {
        if let submitted = report?.submittedAt ?? report?.createdAt, let date = ManagerV43Formatters.parseISODate(submitted) {
            return String(format: NSLocalizedString("mgr_v43_report_for_fmt", comment: ""), date.formatted(date: .abbreviated, time: .omitted))
        }
        return NSLocalizedString("mgr_report", comment: "")
    }

    private func detail(_ r: ReportDetailDTO) -> some View {
        let media = r.media ?? []
        return VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(projectName ?? NSLocalizedString("mgr_tab_projects", comment: ""))
                        .font(.subheadline)
                        .foregroundStyle(ManagerV43.textSecondary)
                    HStack {
                        Circle().fill(ManagerV43.cardStrong).frame(width: 36, height: 36)
                            .overlay(Image(systemName: "person.fill").foregroundStyle(ManagerV43.textSecondary))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(r.userId.map(ManagerV43Formatters.shortIdentifier) ?? NSLocalizedString("mgr_worker", comment: ""))
                                .foregroundStyle(ManagerV43.textPrimary)
                            if let submitted = r.submittedAt ?? r.createdAt, let date = ManagerV43Formatters.parseISODate(submitted) {
                                Text(String(format: NSLocalizedString("mgr_v43_sent_fmt", comment: ""), ManagerV43Formatters.relativeTime(date)))
                                    .font(.caption)
                                    .foregroundStyle(ManagerV43.textSecondary)
                            }
                        }
                        Spacer()
                    }

                    if media.isEmpty {
                        ManagerReportMediaPlaceholder(height: 220)
                    } else {
                        gallery(media)
                    }

                    if let note = r.workerNote, !note.isEmpty {
                        ManagerV43Card {
                            Label(NSLocalizedString("mgr_v43_foreman_comment", comment: ""), systemImage: "text.bubble")
                                .foregroundStyle(ManagerV43.dataBlue)
                            Text(note)
                                .foregroundStyle(ManagerV43.textPrimary)
                        }
                    }

                    if let analysis, let status = analysis.status, !status.isEmpty {
                        ManagerV43Card {
                            Text(NSLocalizedString("mgr_v43_analysis_status", comment: ""))
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                            Text(status)
                                .foregroundStyle(ManagerV43.textPrimary)
                        }
                    }
                    if !approvalHistory.isEmpty {
                        ManagerV43Card {
                            Text(NSLocalizedString("mgr_v43_approval_history", comment: ""))
                                .font(.headline)
                                .foregroundStyle(ManagerV43.textPrimary)
                            ForEach(Array(approvalHistory.enumerated()), id: \.offset) { _, event in
                                HStack {
                                    Text(event.action ?? "—")
                                        .foregroundStyle(ManagerV43.textPrimary)
                                    Spacer()
                                    if let created = event.createdAt {
                                        Text(created)
                                            .font(.caption)
                                            .foregroundStyle(ManagerV43.textSecondary)
                                    }
                                }
                            }
                        }
                    }
                    if ManagerV43Preview.isEnabled {
                        ManagerV43Card(borderColor: ManagerV43.aiViolet.opacity(0.55)) {
                            HStack {
                                ManagerAIBadge(size: 28)
                                Text(NSLocalizedString("mgr_v43_ai_found_deviation", comment: ""))
                                    .font(.headline)
                                    .foregroundStyle(ManagerV43.textPrimary)
                            }
                            Text(NSLocalizedString("mgr_v43_risk_rebar_summary", comment: ""))
                                .font(.subheadline)
                                .foregroundStyle(ManagerV43.textSecondary)
                            Text(NSLocalizedString("mgr_v43_confidence", comment: "") + " 82%")
                                .font(.caption)
                                .foregroundStyle(ManagerV43.aiViolet)
                        }
                    }

                    ManagerV43Card {
                        Text(NSLocalizedString("mgr_v43_your_decision", comment: ""))
                            .font(.headline)
                            .foregroundStyle(ManagerV43.textPrimary)
                        Text(NSLocalizedString("mgr_v43_manager_comment", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        TextField(NSLocalizedString("mgr_v43_comment_optional", comment: ""), text: $managerNoteText, axis: .vertical)
                            .lineLimit(2...4)
                            .disabled(reviewActionLoading)
                            .accessibilityIdentifier("pilot_manager_review_note")
                            .foregroundStyle(ManagerV43.textPrimary)
                            .padding(10)
                            .background(ManagerV43.elevated)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Text("\(managerNoteText.count) / 500")
                            .font(.caption2)
                            .foregroundStyle(ManagerV43.textSecondary)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                        if let err = reviewActionError {
                            Text(err).font(.caption).foregroundStyle(ManagerV43.danger)
                        }
                    }
                }
                .padding(ManagerV43.screenX)
                .padding(.bottom, 12)
            }

            if r.status?.lowercased() == "submitted" {
                HStack(spacing: 12) {
                    Button { submitReview(status: "changes_requested") } label: {
                        Label(NSLocalizedString("mgr_v43_return", comment: ""), systemImage: "arrow.uturn.left")
                            .frame(maxWidth: .infinity)
                            .frame(minHeight: ManagerV43.touch)
                            .foregroundStyle(ManagerV43.danger)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(ManagerV43.danger, lineWidth: 1))
                    }
                    .disabled(reviewActionLoading)
                    .accessibilityIdentifier("pilot_manager_review_request_changes")

                    Button { submitReview(status: "approved") } label: {
                        Label(NSLocalizedString("mgr_v43_approve_report", comment: ""), systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity)
                            .frame(minHeight: ManagerV43.touch)
                            .foregroundStyle(.white)
                            .background(ManagerV43.success)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .disabled(reviewActionLoading)
                    .accessibilityIdentifier("pilot_manager_review_approve")
                }
                .padding(.horizontal, ManagerV43.screenX)
                .padding(.vertical, 10)
                .background(ManagerV43.bg)
                Button(NSLocalizedString("mgr_reject", comment: ""), role: .destructive) { submitReview(status: "rejected") }
                    .disabled(reviewActionLoading)
                    .accessibilityIdentifier("pilot_manager_review_reject")
                    .padding(.bottom, 8)
            }
        }
        .onChange(of: managerNoteText) { _ in
            if managerNoteText.count > 500 { managerNoteText = String(managerNoteText.prefix(500)) }
            if reviewActionError != nil { reviewActionError = nil }
        }
    }

    private func gallery(_ media: [ReportMediaItem]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack(alignment: .topLeading) {
                let selected = media[safe: selectedMedia]
                if let urlStr = selected?.fileUrl, let url = URL(string: urlStr) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        default:
                            ManagerReportMediaPlaceholder(height: 220)
                        }
                    }
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                } else {
                    ManagerReportMediaPlaceholder(height: 220)
                }
                Text(String(format: NSLocalizedString("mgr_v43_media_index_fmt", comment: ""), selectedMedia + 1, media.count))
                    .font(.caption.weight(.semibold))
                    .padding(6)
                    .background(.black.opacity(0.55))
                    .clipShape(Capsule())
                    .padding(10)
                    .foregroundStyle(.white)
                Button {
                    if let urlStr = selected?.fileUrl, let url = URL(string: urlStr) { zoomURL = url }
                } label: {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(.black.opacity(0.45))
                        .clipShape(Circle())
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(10)
                .accessibilityLabel(NSLocalizedString("mgr_v43_zoom", comment: ""))
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(Array(media.enumerated()), id: \.offset) { idx, item in
                        Button { selectedMedia = idx } label: {
                            Group {
                                if let urlStr = item.fileUrl, let url = URL(string: urlStr) {
                                    AsyncImage(url: url) { phase in
                                        if case .success(let image) = phase { image.resizable().scaledToFill() }
                                        else { ManagerReportMediaPlaceholder(height: 64) }
                                    }
                                } else {
                                    ManagerReportMediaPlaceholder(height: 64)
                                }
                            }
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(idx == selectedMedia ? ManagerV43.yellow : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
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
        UINotificationFeedbackGenerator().notificationOccurred(status == "approved" ? .success : .warning)
        Task {
            let success = await runManagerAction(
                setLoading: { reviewActionLoading = $0 },
                setErrorMessage: { reviewActionError = $0 }
            ) {
                report = try await ManagerAPI.reportReview(reportId: reportId, status: status, managerNote: note.isEmpty ? nil : note)
            }
            if success {
                managerNoteText = ""
                ManagerCacheStore.remove(key: "mgr.v43.reports")
                ManagerLiveSync.post(ManagerLiveSync.reportsChanged)
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
            setErrorMessage: { errorMessage = $0 },
            previewFallback: {
                report = ReportDetailDTO(
                    id: reportId,
                    tenantId: nil,
                    userId: "demo-ivan",
                    taskId: "demo-task-rebar",
                    status: "submitted",
                    createdAt: ISO8601DateFormatter().string(from: Date()),
                    submittedAt: ISO8601DateFormatter().string(from: Date()),
                    reviewedAt: nil,
                    reviewedBy: nil,
                    managerNote: nil,
                    workerNote: NSLocalizedString("mgr_v43_risk_rebar_summary", comment: ""),
                    media: []
                )
            }
        ) {
            report = try await ManagerAPI.reportDetail(id: reportId)
            analysis = try? await ManagerAPI.reportAnalysisStatus(reportId: reportId)
            approvalHistory = (try? await ManagerAPI.reportApprovalHistory(reportId: reportId)) ?? []
        }
    }
}

private struct IdentifiedURL: Identifiable {
    var url: URL
    var id: String { url.absoluteString }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

struct ManagerReportMediaPlaceholder: View {
    var height: CGFloat = 220

    var body: some View {
        ZStack {
            ManagerV43.cardStrong
            if ManagerV43Preview.isEnabled {
                Image("DemoRebar")
                    .resizable()
                    .scaledToFill()
            } else {
                VStack(spacing: 6) {
                    Image(systemName: "photo")
                        .font(height > 80 ? .title : .body)
                    if height > 80 {
                        Text(NSLocalizedString("mgr_v43_no_media", comment: ""))
                            .font(.caption)
                    }
                }
                .foregroundStyle(ManagerV43.textSecondary)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .clipped()
        .accessibilityHidden(true)
    }
}

struct FilterChip: View {
    let title: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        ManagerV43Chip(title: title, selected: selected, action: action)
    }
}
