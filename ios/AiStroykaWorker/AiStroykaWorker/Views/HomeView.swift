//
//  HomeView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    let project: ProjectDTO
    let onLogout: () -> Void
    @ObservedObject private var store = AppStateStoreManager.shared
    @ObservedObject private var opStore = OperationQueueStore.shared
    @ObservedObject private var executor = OperationQueueExecutor.shared
    @ObservedObject private var syncService = SyncService.shared
    @State private var errorMessage: String?
    @State private var navigateToNewReport = false
    @State private var resumeDraftReportId: String?
    @State private var todayTasks: [TaskDTO] = []
    @State private var tasksLoading = false
    @State private var showDiagnostics = false
    @State private var activationStatus: WorkerActivationStatusDTO?
    @State private var helpHints: [WorkerHelpHintDTO] = []
    @State private var guideSummary: String?
    @State private var guideConfidence: Int?
    @State private var guideRiskSignals: [WorkerHelpAssistantRiskSignalDTO] = []

    private var shiftStarted: Bool { store.state.shift.isStarted }
    private var dayId: String? { store.state.shift.dayId }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                workerStartGuidanceCard
                let pending = opStore.pendingCount()
                if pending > 0 {
                    HStack {
                        Text("Pending: \(pending)")
                            .font(.caption)
                            .foregroundColor(.orange)
                        Button(executor.isPaused ? "Resume queue" : "Pause queue") {
                            if executor.isPaused { executor.resumeQueue() } else { executor.pauseQueue() }
                        }
                        .font(.caption)
                    }
                    .padding(8)
                    .background(Color.orange.opacity(0.15))
                    .cornerRadius(8)
                }
                if store.pendingCount > 0 {
                    HStack {
                        Text("Pending uploads: \(store.pendingCount)")
                            .font(.caption)
                            .foregroundColor(.orange)
                        Button("Resume uploads") {
                            resumeDraftReportId = store.state.draftReportId
                            navigateToNewReport = true
                        }
                        .font(.caption)
                    }
                    .padding(8)
                    .background(Color.orange.opacity(0.15))
                    .cornerRadius(8)
                }
                HStack {
                    Text(project.name ?? project.id)
                        .font(.headline)
                    Spacer()
                    Text(syncStatusLabel)
                        .font(.caption2)
                        .foregroundColor(syncStatusColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(syncStatusColor.opacity(0.15))
                        .cornerRadius(4)
                }
                if let err = errorMessage {
                    Text(err).foregroundColor(.red).font(.caption)
                }
                // Shift status
                HStack {
                    Text(shiftStarted ? "Shift in progress" : "Shift not started")
                        .foregroundColor(shiftStarted ? .green : .secondary)
                }
                HStack(spacing: 12) {
                    Button("Start shift") { startShift() }
                        .disabled(shiftStarted)
                    Button("End shift") { endShift() }
                        .disabled(!shiftStarted)
                }
                // Today's tasks (Phase 7.5)
                if tasksLoading && todayTasks.isEmpty {
                    ProgressView("Loading tasks…")
                } else if !todayTasks.isEmpty {
                    Text("Today's tasks").font(.subheadline).fontWeight(.semibold)
                    ForEach(todayTasks, id: \.id) { task in
                        NavigationLink {
                            TaskDetailView(task: task, projectId: project.id, dayId: dayId)
                        } label: {
                            HStack {
                                Text(task.title)
                                Spacer()
                                Text(task.status).font(.caption).foregroundColor(.secondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
                Button("New report") {
                    store.save { $0.draftTaskId = nil }
                    resumeDraftReportId = nil
                    navigateToNewReport = true
                }
                Spacer()
                Button("Support") { showDiagnostics = true }
                    .foregroundColor(.secondary)
                Button("Sign out", action: onLogout)
                    .foregroundColor(.secondary)
            }
            .padding()
            .sheet(isPresented: $showDiagnostics) {
                NavigationStack {
                    DiagnosticsView()
                        .environmentObject(appState)
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("Done") { showDiagnostics = false }
                            }
                        }
                }
            }
            .navigationDestination(isPresented: $navigateToNewReport) {
                ReportCreateView(
                    projectId: project.id,
                    dayId: dayId,
                    draftReportId: resumeDraftReportId,
                    taskId: nil,
                    taskTitle: nil
                )
            }
        }
        .onAppear {
            loadTodayTasks()
            loadHelpHints()
            OperationQueueExecutor.shared.runLoop()
            if syncService.status == .idle || syncService.status == .offline {
                syncService.runSyncIfOnline()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .aiStroykaWorkerPushPayload)) { notification in
            guard let type = notification.userInfo?["type"] as? String else { return }
            switch type {
            case "task_assigned", "task_updated": loadTodayTasks()
            case "report_reminder", "upload_failed": break
            default: break
            }
        }
    }

    private var workerStartGuidanceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(NSLocalizedString("worker_start_title", comment: ""))
                .font(.headline)
            Text(
                String(
                    format: NSLocalizedString("worker_start_progress_fmt", comment: ""),
                    completedLaunchSteps,
                    totalLaunchSteps
                )
            )
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(launchDone(activationStatus?.getStarted?.addTask) ? "✓" : "○") \(NSLocalizedString("worker_start_step_1", comment: ""))")
                .font(.subheadline)
            Text("\(launchDone(activationStatus?.getStarted?.uploadReport) ? "✓" : "○") \(NSLocalizedString("worker_start_step_2", comment: ""))")
                .font(.subheadline)
            Text("\(launchDone(activationStatus?.getStarted?.viewAi) ? "✓" : "○") \(NSLocalizedString("worker_start_step_3", comment: ""))")
                .font(.subheadline)

            Text(NSLocalizedString("worker_ai_hints_title", comment: ""))
                .font(.subheadline)
                .fontWeight(.semibold)
                .padding(.top, 4)
            if let guideSummary, !guideSummary.isEmpty {
                Text(guideSummary)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if let guideConfidence {
                Text(
                    String(
                        format: NSLocalizedString("worker_ai_guide_confidence_fmt", comment: ""),
                        guideConfidence
                    )
                )
                .font(.caption)
            }
            if helpHints.isEmpty {
                Text("• \(NSLocalizedString("worker_ai_hint_1", comment: ""))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("• \(NSLocalizedString("worker_ai_hint_2", comment: ""))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(Array(helpHints.prefix(2).enumerated()), id: \.offset) { _, hint in
                    Text("• \(hint.title)")
                        .font(.caption)
                    if !hint.reason.isEmpty {
                        Text(hint.reason)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            if !guideRiskSignals.isEmpty {
                Text(NSLocalizedString("worker_ai_risk_signals_title", comment: ""))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .padding(.top, 2)
                ForEach(Array(guideRiskSignals.prefix(2).enumerated()), id: \.offset) { _, signal in
                    Text("• \(signal.title)")
                        .font(.caption)
                    Text(signal.detail)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orange.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var syncStatusLabel: String {
        switch syncService.status {
        case .idle: return "Sync"
        case .synced: return "Synced"
        case .syncing: return "Syncing…"
        case .needsBootstrap: return "Bootstrap"
        case .offline: return "Offline"
        case .error: return "Error"
        }
    }

    private var syncStatusColor: Color {
        switch syncService.status {
        case .synced: return .green
        case .syncing: return .blue
        case .offline: return .orange
        case .needsBootstrap, .error: return .red
        case .idle: return .gray
        }
    }

    private func startShift() {
        let day = todayDayId()
        let key = getOrCreateStartKey(dayId: day)
        let op = QueuedOperation(
            id: UUID().uuidString,
            type: .startShift,
            payload: OperationPayload(dayId: day, taskId: nil, reportId: nil, purpose: nil, photoItemId: nil, sessionId: nil, uploadPath: nil, objectPath: nil, mimeType: nil, sizeBytes: nil, imageDataBase64: nil, cursor: nil),
            idempotencyKey: key,
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
    }

    private func endShift() {
        let day = store.state.shift.dayId ?? todayDayId()
        let key = getOrCreateEndKey(dayId: day)
        let op = QueuedOperation(
            id: UUID().uuidString,
            type: .endShift,
            payload: OperationPayload(dayId: day, taskId: nil, reportId: nil, purpose: nil, photoItemId: nil, sessionId: nil, uploadPath: nil, objectPath: nil, mimeType: nil, sizeBytes: nil, imageDataBase64: nil, cursor: nil),
            idempotencyKey: key,
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
    }

    private func todayDayId() -> String {
        ISO8601DateFormatter().string(from: Date()).prefix(10).replacingOccurrences(of: "-", with: "")
    }

    private func getOrCreateStartKey(dayId: String) -> String {
        var keys = store.state.shiftIdempotencyKeys[dayId] ?? ShiftIdempotencyKeys(startKey: nil, endKey: nil)
        if let k = keys.startKey { return k }
        let key = DeviceContext.newIdempotencyKey()
        keys.startKey = key
        store.save { $0.shiftIdempotencyKeys[dayId] = keys }
        return key
    }

    private func getOrCreateEndKey(dayId: String) -> String {
        var keys = store.state.shiftIdempotencyKeys[dayId] ?? ShiftIdempotencyKeys(startKey: nil, endKey: nil)
        if let k = keys.endKey { return k }
        let key = DeviceContext.newIdempotencyKey()
        keys.endKey = key
        store.save { $0.shiftIdempotencyKeys[dayId] = keys }
        return key
    }

    private func loadTodayTasks() {
        tasksLoading = true
        Task {
            do {
                let list = try await WorkerAPI.tasksToday(projectId: project.id)
                await MainActor.run {
                    todayTasks = list
                    tasksLoading = false
                }
            } catch {
                await MainActor.run {
                    todayTasks = []
                    tasksLoading = false
                }
            }
        }
    }

    private func loadHelpHints() {
        Task {
            let activation = try? await WorkerAPI.activationStatus()
            await MainActor.run {
                activationStatus = activation
            }
            guard let getStarted = activation?.getStarted else {
                await MainActor.run { helpHints = [] }
                return
            }
            let hints = (try? await WorkerAPI.helpHints(
                locale: supportedHelpLocale(),
                role: "manager",
                getStarted: getStarted
            )) ?? []
            let assistant = try? await WorkerAPI.helpAssistant(
                query: "",
                locale: supportedHelpLocale(),
                role: "manager",
                pathname: "/worker",
                activation: activation
            )
            await WorkerAPI.helpAssistantEvent(
                type: "open",
                locale: supportedHelpLocale(),
                role: "manager",
                pathname: "/worker"
            )
            await MainActor.run {
                helpHints = hints
                guideSummary = assistant?.summary
                guideConfidence = assistant?.confidence
                guideRiskSignals = assistant?.riskSignals ?? []
            }
        }
    }

    private var completedLaunchSteps: Int {
        [
            activationStatus?.getStarted?.createProject,
            activationStatus?.getStarted?.inviteTeam,
            activationStatus?.getStarted?.addTask,
            activationStatus?.getStarted?.uploadReport,
            activationStatus?.getStarted?.viewAi,
        ].filter { $0 == true }.count
    }

    private var totalLaunchSteps: Int { 5 }

    private func launchDone(_ value: Bool?) -> Bool { value == true }

    private func supportedHelpLocale() -> String {
        let preferred = Locale.preferredLanguages.first ?? "en"
        let language = String(preferred.prefix(2)).lowercased()
        return ["ru", "es", "it"].contains(language) ? language : "en"
    }
}
