//
//  HomeView.swift
//  AiStroykaWorker
//

import SwiftUI

struct HomeView: View {
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

    private var shiftStarted: Bool { store.state.shift.isStarted }
    private var dayId: String? { store.state.shift.dayId }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
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
                Button("Sign out", action: onLogout)
                    .foregroundColor(.secondary)
            }
            .padding()
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
}
