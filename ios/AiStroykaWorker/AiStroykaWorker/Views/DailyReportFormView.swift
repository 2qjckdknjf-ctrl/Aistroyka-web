//
//  DailyReportFormView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct DailyReportFormView: View {
    let projectId: String
    let dayId: String?
    var draftReportId: String?
    var taskId: String?
    var taskTitle: String?
    @State private var goReview = false
    @State private var workerNote = ""

    private var progress: WorkerTaskProgress {
        WorkerTaskProgressStore.load(taskId: taskId ?? "preview-task-1")
    }

    var body: some View {
        VStack(spacing: 0) {
            if WorkerV43Preview.isEnabled {
                previewForm
            } else {
                ReportCreateView(
                    projectId: projectId,
                    dayId: dayId,
                    draftReportId: draftReportId ?? AppStateStoreManager.shared.state.draftReportId,
                    taskId: taskId,
                    taskTitle: taskTitle,
                    showsNavigationTitle: false,
                    autoCreateOnAppear: true
                )
            }
            WorkerV43PrimaryButton(title: NSLocalizedString("wrk_v43_check_continue", comment: ""), systemImage: "arrow.right") {
                goReview = true
            }
            .padding(WorkerV43.screenX)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier("pilot_worker_daily_report")
        .navigationTitle(NSLocalizedString("wrk_v43_daily_report", comment: ""))
        .background(
            NavigationLink(
                destination: ReportReviewSubmitView(
                    projectId: projectId,
                    dayId: dayId,
                    draftReportId: draftReportId ?? AppStateStoreManager.shared.state.draftReportId,
                    taskId: taskId,
                    taskTitle: taskTitle
                ),
                isActive: $goReview
            ) { EmptyView() }
            .hidden()
        )
        .onAppear {
            if workerNote.isEmpty, let taskId {
                workerNote = WorkerTaskProgressStore.load(taskId: taskId).managerNote()
            }
        }
    }

    private var previewForm: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(taskTitle ?? NSLocalizedString("wrk_v43_daily_report", comment: ""))
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                WorkerV43Card {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(NSLocalizedString("wrk_v43_actual_volume", comment: ""))
                            .foregroundStyle(WorkerV43.textSecondary)
                        Text(String(format: NSLocalizedString("wrk_v43_volume_pair_fmt", comment: ""), progress.actualVolume, progress.plannedVolume))
                            .foregroundStyle(WorkerV43.textPrimary)
                    }
                }
                WorkerV43Card {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(NSLocalizedString("wrk_v43_photo_before_ready", comment: ""))
                            .foregroundStyle(WorkerV43.success)
                        Text(NSLocalizedString("wrk_v43_photos_queued", comment: ""))
                            .font(.caption)
                            .foregroundStyle(WorkerV43.textSecondary)
                    }
                }
                WorkerV43Card {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(NSLocalizedString("worker_report_note_label", comment: ""))
                            .foregroundStyle(WorkerV43.textSecondary)
                        TextField(NSLocalizedString("worker_report_note_placeholder", comment: ""), text: $workerNote, axis: .vertical)
                            .lineLimit(3...6)
                            .foregroundStyle(WorkerV43.textPrimary)
                            .accessibilityIdentifier("pilot_worker_report_note")
                    }
                }
            }
            .padding(WorkerV43.screenX)
        }
    }
}

struct ReportReviewSubmitView: View {
    let projectId: String
    let dayId: String?
    var draftReportId: String?
    var taskId: String?
    var taskTitle: String?
    @State private var submitted = false
    @State private var analysis: WorkerAnalysisStatusDTO?
    @ObservedObject private var opStore = OperationQueueStore.shared

    private var progress: WorkerTaskProgress {
        WorkerTaskProgressStore.load(taskId: taskId ?? "preview-task-1")
    }

    private var resolvedDraftId: String? {
        draftReportId ?? AppStateStoreManager.shared.state.draftReportId
    }

    private var liveSubmitted: Bool {
        guard let did = resolvedDraftId else { return false }
        return opStore.operation(id: WorkerReportOpIds.submitReport(draftId: did))?.state == .succeeded
    }

    private var serverReportId: String? {
        guard let did = resolvedDraftId else { return nil }
        return opStore.operation(id: WorkerReportOpIds.createReport(draftId: did))?.resultReportId
    }

    private var analysisTitle: String {
        if WorkerV43Preview.isEnabled {
            return NSLocalizedString("wrk_v43_report_ready", comment: "")
        }
        return WorkerV43Copy.analysisStatus(analysis?.status)
    }

    private var analysisDetail: String {
        if WorkerV43Preview.isEnabled {
            return NSLocalizedString("wrk_v43_ai_checks", comment: "")
        }
        if let summary = analysis?.summary, let total = summary.mediaTotal, let done = summary.analyzed {
            return String(format: NSLocalizedString("wrk_v43_ai_jobs_fmt", comment: ""), done, total)
        }
        return NSLocalizedString("wrk_v43_ai_checks", comment: "")
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(taskTitle ?? NSLocalizedString("wrk_v43_daily_report", comment: ""))
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    Spacer()
                    WorkerV43StatusPill(text: NSLocalizedString("wrk_v43_draft", comment: ""), kind: .info)
                }
                WorkerV43Card(borderColor: WorkerV43.aiViolet.opacity(0.5), fill: WorkerV43.card.opacity(0.9)) {
                    HStack {
                        ZStack {
                            Circle().fill(WorkerV43.aiViolet.opacity(0.2)).frame(width: 40, height: 40)
                            Text("AI").font(.caption.weight(.bold)).foregroundStyle(WorkerV43.aiViolet)
                        }
                        VStack(alignment: .leading) {
                            Text(analysisTitle)
                                .foregroundStyle(WorkerV43.textPrimary)
                            Text(analysisDetail)
                                .font(.caption)
                                .foregroundStyle(WorkerV43.textSecondary)
                        }
                    }
                }
                WorkerV43Card {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(String(format: NSLocalizedString("wrk_v43_volume_pair_fmt", comment: ""), progress.actualVolume, progress.plannedVolume))
                            .foregroundStyle(WorkerV43.textPrimary)
                        Text(NSLocalizedString("wrk_v43_photos_queued", comment: ""))
                            .font(.caption)
                            .foregroundStyle(WorkerV43.textSecondary)
                    }
                }
                if WorkerV43Preview.isEnabled {
                    if submitted {
                        Text(NSLocalizedString("worker_submitted", comment: ""))
                            .foregroundStyle(WorkerV43.success)
                    } else {
                        WorkerV43PrimaryButton(title: NSLocalizedString("worker_submit_report", comment: "")) {
                            submitted = true
                        }
                        .accessibilityIdentifier("pilot_worker_submit_report")
                    }
                } else {
                    ReportCreateView(
                        projectId: projectId,
                        dayId: dayId,
                        draftReportId: resolvedDraftId,
                        taskId: taskId,
                        taskTitle: taskTitle,
                        showsNavigationTitle: false,
                        autoCreateOnAppear: true,
                        hidesLegacySubmit: true
                    )
                    if liveSubmitted {
                        Text(NSLocalizedString("worker_submitted", comment: ""))
                            .foregroundStyle(WorkerV43.success)
                    } else {
                        WorkerV43PrimaryButton(title: NSLocalizedString("worker_submit_report", comment: "")) {
                            NotificationCenter.default.post(name: .workerV43SubmitReport, object: nil)
                        }
                        .accessibilityIdentifier("pilot_worker_submit_report")
                    }
                }
            }
            .padding(WorkerV43.screenX)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier("pilot_worker_report_review")
        .navigationTitle(NSLocalizedString("wrk_v43_report_review", comment: ""))
        .onChange(of: liveSubmitted) { submitted in
            if submitted { refreshAnalysis() }
        }
        .onAppear { refreshAnalysis() }
    }

    private func refreshAnalysis() {
        guard !WorkerV43Preview.isEnabled, let reportId = serverReportId else { return }
        Task {
            for _ in 0..<8 {
                let latest = try? await WorkerAPI.analysisStatus(reportId: reportId)
                await MainActor.run { analysis = latest }
                let status = latest?.status.lowercased() ?? ""
                if status.isEmpty || status == "success" || status == "failed" || status == "none" {
                    break
                }
                try? await Task.sleep(nanoseconds: 2_000_000_000)
            }
        }
    }
}

struct ManagerFeedbackResubmitView: View {
    let reportId: String
    var notificationId: String? = nil

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(WorkerV43.warning)
                VStack(alignment: .leading) {
                    Text(NSLocalizedString("wrk_v43_returned", comment: ""))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(WorkerV43.warning)
                    Text(WorkerV43Formatters.clock(Date()))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                }
                Spacer()
            }
            .padding(WorkerV43.screenX)
            ReportResubmitView(reportId: reportId)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier("pilot_worker_feedback_resubmit")
        .navigationTitle(NSLocalizedString("worker_report_resubmit_title", comment: ""))
        .onAppear {
            if let notificationId, !WorkerV43Preview.isEnabled {
                Task { await WorkerAPI.markNotificationRead(id: notificationId) }
            }
        }
    }
}
