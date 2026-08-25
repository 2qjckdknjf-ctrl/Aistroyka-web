//
//  WorkInProgressView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct WorkInProgressView: View {
    let task: TaskDTO
    let projectId: String
    let dayId: String?
    @State private var progress: WorkerTaskProgress
    @State private var showAfter = false
    @State private var showIssue = false
    @State private var gateMessage: String?
    @ObservedObject private var network = NetworkMonitor.shared
    @ObservedObject private var opStore = OperationQueueStore.shared

    init(task: TaskDTO, projectId: String, dayId: String?) {
        self.task = task
        self.projectId = projectId
        self.dayId = dayId
        _progress = State(initialValue: WorkerTaskProgressStore.load(taskId: task.id))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    WorkerV43ProgressRing(progress: progress.progress)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(String(format: NSLocalizedString("wrk_v43_steps_fmt", comment: ""), progress.completedStepIndexes.count, 5))
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(WorkerV43.textPrimary)
                        Text(NSLocalizedString("wrk_v43_photo_before_ready", comment: ""))
                            .font(.caption)
                            .foregroundStyle(WorkerV43.success)
                    }
                    Spacer()
                }
                ForEach(0..<5, id: \.self) { idx in
                    stepRow(idx)
                }
                WorkerV43Card {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(NSLocalizedString("wrk_v43_actual_volume", comment: ""))
                            .foregroundStyle(WorkerV43.textSecondary)
                        HStack {
                            Button { progress.actualVolume = max(0, progress.actualVolume - 1) } label: {
                                Image(systemName: "minus")
                            }
                            .frame(width: 44, height: 44)
                            Text(String(format: NSLocalizedString("wrk_v43_volume_pair_fmt", comment: ""), progress.actualVolume, progress.plannedVolume))
                                .foregroundStyle(WorkerV43.textPrimary)
                            Button { progress.actualVolume += 1 } label: {
                                Image(systemName: "plus")
                            }
                            .frame(width: 44, height: 44)
                        }
                        .foregroundStyle(WorkerV43.yellow)
                    }
                }
                if !network.isConnected {
                    WorkerV43OfflineBanner(queued: opStore.pendingCount())
                }
                if let gateMessage {
                    Text(gateMessage).font(.caption).foregroundStyle(WorkerV43.warning)
                }
                WorkerV43OutlineButton(
                    title: NSLocalizedString("wrk_v43_report_issue", comment: ""),
                    systemImage: "exclamationmark.triangle",
                    tint: WorkerV43.danger
                ) { showIssue = true }
                WorkerV43PrimaryButton(
                    title: String(format: NSLocalizedString("wrk_v43_finish_step_fmt", comment: ""), min(progress.completedStepIndexes.count + 1, 5))
                ) { finishCurrent() }
            }
            .padding(WorkerV43.screenX)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier("pilot_worker_v43_wip")
        .navigationTitle(task.title)
        .background(
            NavigationLink(
                destination: CameraEvidenceView(kind: .after, task: task, projectId: projectId, dayId: dayId),
                isActive: $showAfter
            ) { EmptyView() }
            .hidden()
        )
        .sheet(isPresented: $showIssue) {
            NavigationStack {
                IssuesListView(
                    project: ProjectDTO(id: projectId, name: nil),
                    initialReport: true,
                    linkedTaskId: task.id
                )
            }
        }
        .onChange(of: progress) { value in
            WorkerTaskProgressStore.save(value)
        }
        .onAppear { markTaskStarted() }
    }

    private func stepRow(_ idx: Int) -> some View {
        let done = progress.completedStepIndexes.contains(idx)
        let current = idx == progress.completedStepIndexes.count
        return VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(done ? WorkerV43.success : WorkerV43.dataBlue)
                Text("\(idx + 1). \(NSLocalizedString("wrk_v43_step_\(idx + 1)", comment: ""))")
                    .foregroundStyle(WorkerV43.textPrimary)
            }
            if current && idx == 3 {
                HStack {
                    Text(String(format: NSLocalizedString("wrk_v43_measure_fmt", comment: ""), progress.measurementMm ?? 26))
                    Spacer()
                    WorkerV43StatusPill(text: NSLocalizedString("wrk_v43_normal", comment: ""), kind: .success)
                }
                .font(.caption)
                .foregroundStyle(WorkerV43.textSecondary)
            }
        }
        .padding(12)
        .background(current ? WorkerV43.cardStrong : WorkerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func markTaskStarted() {
        guard !WorkerV43Preview.isEnabled else { return }
        Task {
            try? await WorkerAPI.startAssignedTask(
                taskId: task.id,
                idempotencyKey: DeviceContext.newIdempotencyKey()
            )
        }
    }

    private func finishCurrent() {
        let next = progress.completedStepIndexes.count
        if next < 5 {
            progress.completedStepIndexes.append(next)
        }
        WorkerTaskProgressStore.save(progress)
        AppStateStoreManager.shared.save { $0.draftTaskId = task.id }
        if progress.completedStepIndexes.count >= 4 {
            let reason = WorkerReportGate.blockedReason(
                requiredStepsDone: progress.completedStepIndexes.count >= 4,
                beforeReady: true,
                afterReady: false
            )
            if let reason, progress.completedStepIndexes.count >= 5 {
                gateMessage = reason
            }
            showAfter = true
        }
    }
}
