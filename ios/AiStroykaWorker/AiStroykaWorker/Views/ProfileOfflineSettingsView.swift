//
//  ProfileOfflineSettingsView.swift
//  AiStroykaWorker
//

import SwiftUI
import UIKit
import Shared

struct ProfileOfflineSettingsView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var router: WorkerTabRouter
    let project: ProjectDTO
    let onLogout: () -> Void
    let onLeaveProject: () -> Void
    @ObservedObject private var store = AppStateStoreManager.shared
    @ObservedObject private var opStore = OperationQueueStore.shared
    @ObservedObject private var sync = SyncService.shared
    @ObservedObject private var executor = OperationQueueExecutor.shared
    @State private var settings = WorkerSettingsStore.load()
    @State private var showDiagnostics = false
    @State private var showIssues = false
    @State private var showDocuments = false
    @State private var showReports = false
    @State private var ending = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(NSLocalizedString("wrk_v43_more", comment: ""))
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    profileCard
                    shiftCard
                    syncCard
                    section(NSLocalizedString("wrk_v43_work", comment: "")) {
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_daily_reports", comment: ""),
                            systemImage: "doc.text",
                            badge: store.state.draftReportId == nil ? nil : NSLocalizedString("wrk_v43_draft", comment: ""),
                            action: { showReports = true }
                        )
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_issues", comment: ""),
                            systemImage: "exclamationmark.triangle",
                            iconTint: WorkerV43.warning,
                            action: { showIssues = true }
                        )
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_documents", comment: ""),
                            systemImage: "folder",
                            action: { showDocuments = true }
                        )
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_briefings", comment: ""),
                            systemImage: "book",
                            iconTint: WorkerV43.aiViolet,
                            action: { showDocuments = true }
                        )
                    }
                    section(NSLocalizedString("wrk_v43_settings", comment: "")) {
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_notifications", comment: ""),
                            systemImage: "bell",
                            action: { router.openMessages() }
                        )
                        qualityRow
                        geoRow
                        Toggle(isOn: $settings.dataSaver) {
                            Label(NSLocalizedString("wrk_v43_data_saver", comment: ""), systemImage: "chart.bar")
                                .foregroundStyle(WorkerV43.textPrimary)
                        }
                        .tint(WorkerV43.dataBlue)
                        languageRow
                    }
                    aiCard
                    section(NSLocalizedString("wrk_v43_safety_help", comment: "")) {
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_emergency", comment: ""),
                            systemImage: "phone.fill",
                            iconTint: WorkerV43.danger,
                            action: confirmEmergency
                        )
                        WorkerV43Row(
                            title: NSLocalizedString("worker_support", comment: ""),
                            systemImage: "questionmark.circle",
                            action: { showDiagnostics = true }
                        )
                        WorkerV43Row(
                            title: NSLocalizedString("wrk_v43_about", comment: ""),
                            subtitle: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
                            systemImage: "info.circle",
                            action: { showDiagnostics = true }
                        )
                    }
                    Button(NSLocalizedString("worker_sign_out", comment: ""), action: onLogout)
                        .foregroundStyle(WorkerV43.danger)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: WorkerV43.fieldTouch)
                        .accessibilityIdentifier("pilot_worker_sign_out")
                }
                .padding(WorkerV43.screenX)
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showDiagnostics) {
                NavigationStack { DiagnosticsView().environmentObject(appState) }
            }
            .background(
                ZStack {
                    NavigationLink(
                        destination: IssuesListView(project: project, linkedTaskId: router.pendingTaskId),
                        isActive: $showIssues
                    ) { EmptyView() }
                    NavigationLink(
                        destination: DocumentsDrawingsView(project: project),
                        isActive: $showDocuments
                    ) { EmptyView() }
                    NavigationLink(
                        destination: DailyReportFormView(
                            projectId: project.id,
                            dayId: store.state.shift.dayId,
                            draftReportId: store.state.draftReportId,
                            taskId: store.state.draftTaskId,
                            taskTitle: nil
                        ),
                        isActive: $showReports
                    ) { EmptyView() }
                }
                .hidden()
            )
            .onChange(of: settings) { value in
                WorkerSettingsStore.save(value)
            }
            .onAppear { consumeMoreDestination() }
            .onChange(of: router.moreDestination) { _ in
                consumeMoreDestination()
            }
        }
    }

    private var profileCard: some View {
        WorkerV43Card {
            HStack {
                Circle()
                    .fill(WorkerV43.cardStrong)
                    .frame(width: 52, height: 52)
                    .overlay(Image(systemName: "person.fill").foregroundStyle(WorkerV43.cyan))
                VStack(alignment: .leading, spacing: 4) {
                    Text(WorkerV43Preview.showsCatalogWithoutAuth
                         ? NSLocalizedString("wrk_v43_preview_worker_name", comment: "")
                         : (appState.currentUser ?? NSLocalizedString("wrk_v43_worker", comment: "")))
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    Text(WorkerV43Preview.showsCatalogWithoutAuth
                         ? NSLocalizedString("wrk_v43_preview_worker_role", comment: "")
                         : NSLocalizedString("wrk_v43_worker", comment: ""))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                    Text(project.name ?? project.id)
                        .font(.caption)
                        .foregroundStyle(WorkerV43.cyan)
                }
                Spacer()
                Button(action: onLeaveProject) {
                    Image(systemName: "chevron.right").foregroundStyle(WorkerV43.textSecondary)
                }
                .accessibilityLabel(NSLocalizedString("worker_nav_projects", comment: ""))
            }
        }
    }

    private var shiftCard: some View {
        WorkerV43Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .foregroundStyle(WorkerV43.success)
                    Text(store.state.shift.isStarted || WorkerV43Preview.isEnabled
                         ? NSLocalizedString("worker_shift_in_progress", comment: "")
                         : NSLocalizedString("worker_shift_not_started", comment: ""))
                        .foregroundStyle(WorkerV43.textPrimary)
                    Spacer()
                }
                if let started = WorkerShiftEvidenceStore.load().startedAt.flatMap({ ISO8601DateFormatter().date(from: $0) }) {
                    Text(String(format: NSLocalizedString("wrk_v43_worked_fmt", comment: ""), WorkerV43Formatters.compactDuration(from: started)))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                }
                if store.state.shift.isStarted || WorkerV43Preview.isEnabled {
                    WorkerV43OutlineButton(title: NSLocalizedString("worker_end_shift", comment: ""), enabled: !ending && !WorkerV43Preview.isEnabled) {
                        endShift()
                    }
                    .accessibilityIdentifier("pilot_worker_end_shift")
                } else {
                    WorkerV43PrimaryButton(title: NSLocalizedString("worker_start_shift", comment: "")) {
                        router.openShiftStart = true
                    }
                    .accessibilityIdentifier("pilot_worker_start_shift")
                }
            }
        }
    }

    private var syncCard: some View {
        WorkerV43Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: "checkmark.icloud.fill").foregroundStyle(WorkerV43.success)
                    VStack(alignment: .leading) {
                        Text(WorkerSyncLabel.from(status: sync.status, lastSync: nil).0)
                            .foregroundStyle(WorkerV43.textPrimary)
                        Text(String(format: NSLocalizedString("worker_pending", comment: ""), opStore.pendingCount()))
                            .font(.caption)
                            .foregroundStyle(WorkerV43.textSecondary)
                    }
                }
                WorkerV43OutlineButton(title: NSLocalizedString("wrk_v43_manage_sync", comment: "")) {
                    if executor.isPaused { executor.resumeQueue() } else { executor.pauseQueue() }
                    sync.runSyncIfOnline()
                }
                .accessibilityIdentifier(executor.isPaused ? "pilot_worker_resume_queue" : "pilot_worker_pause_queue")
            }
        }
    }

    private var aiCard: some View {
        WorkerV43Card(borderColor: WorkerV43.aiViolet.opacity(0.4), fill: WorkerV43.aiViolet.opacity(0.12)) {
            HStack {
                ZStack {
                    Circle().fill(WorkerV43.aiViolet).frame(width: 36, height: 36)
                    Text("AI").font(.caption.bold()).foregroundStyle(.white)
                }
                VStack(alignment: .leading) {
                    Text(NSLocalizedString("wrk_v43_assistant", comment: "")).foregroundStyle(WorkerV43.textPrimary)
                    Text(NSLocalizedString("wrk_v43_assistant_sub", comment: ""))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                }
                Spacer()
                Toggle("", isOn: $settings.aiAssistant).labelsHidden().tint(WorkerV43.aiViolet)
            }
        }
    }

    private var qualityRow: some View {
        HStack {
            Label(NSLocalizedString("wrk_v43_camera_quality", comment: ""), systemImage: "camera")
                .foregroundStyle(WorkerV43.textPrimary)
            Spacer()
            Picker("", selection: $settings.cameraQuality) {
                Text(NSLocalizedString("wrk_v43_quality_high", comment: "")).tag("high")
                Text(NSLocalizedString("wrk_v43_quality_saver", comment: "")).tag("saver")
            }
            .pickerStyle(.menu)
            .tint(WorkerV43.cyan)
        }
        .frame(minHeight: WorkerV43.touch)
    }

    private var geoRow: some View {
        HStack {
            Label(NSLocalizedString("wrk_v43_geo", comment: ""), systemImage: "mappin.and.ellipse")
                .foregroundStyle(WorkerV43.textPrimary)
            Spacer()
            Picker("", selection: $settings.geoScope) {
                Text(NSLocalizedString("wrk_v43_geo_shift", comment: "")).tag("shift")
                Text(NSLocalizedString("wrk_v43_geo_never", comment: "")).tag("never")
            }
            .pickerStyle(.menu)
            .tint(WorkerV43.cyan)
        }
        .frame(minHeight: WorkerV43.touch)
    }

    private var languageRow: some View {
        Button {
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
        } label: {
            HStack {
                Label(NSLocalizedString("wrk_v43_language", comment: ""), systemImage: "globe")
                    .foregroundStyle(WorkerV43.textPrimary)
                Spacer()
                Text(settings.languageCode.uppercased()).foregroundStyle(WorkerV43.cyan)
            }
            .frame(minHeight: WorkerV43.touch)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(NSLocalizedString("wrk_v43_open_settings", comment: ""))
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: @escaping () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(WorkerV43.textSecondary)
            WorkerV43Card(content: content)
        }
    }

    private func consumeMoreDestination() {
        switch router.consumeMoreDestination() {
        case .none:
            break
        case .issues:
            showIssues = true
        case .documents:
            showDocuments = true
        case .reports:
            showReports = true
        }
    }

    private func confirmEmergency() {
        guard let url = URL(string: "tel://112") else { return }
        UIApplication.shared.open(url)
    }

    private func endShift() {
        ending = true
        let day = store.state.shift.dayId ?? ISO8601DateFormatter().string(from: Date()).prefix(10).replacingOccurrences(of: "-", with: "")
        var keys = store.state.shiftIdempotencyKeys[day] ?? ShiftIdempotencyKeys(startKey: nil, endKey: nil)
        if keys.endKey == nil { keys.endKey = DeviceContext.newIdempotencyKey() }
        store.save { $0.shiftIdempotencyKeys[day] = keys }
        let op = QueuedOperation(
            id: UUID().uuidString,
            type: .endShift,
            payload: OperationPayload(dayId: day),
            idempotencyKey: keys.endKey ?? DeviceContext.newIdempotencyKey(),
            dependsOn: [],
            state: .queued,
            attemptCount: 0,
            nextAttemptAt: nil,
            lastErrorCode: nil,
            lastErrorMessage: nil,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            updatedAt: ISO8601DateFormatter().string(from: Date()),
            resultReportId: nil,
            resultSessionId: nil,
            resultUploadPath: nil
        )
        opStore.add(op)
        executor.runLoop()
        store.save { $0.shift.endedAt = ISO8601DateFormatter().string(from: Date()); $0.shift.dayId = nil }
        var evidence = WorkerShiftEvidenceStore.load()
        evidence.endedAt = ISO8601DateFormatter().string(from: Date())
        WorkerShiftEvidenceStore.save(evidence)
        ending = false
    }
}
