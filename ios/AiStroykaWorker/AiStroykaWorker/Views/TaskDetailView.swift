//
//  TaskDetailView.swift
//  AiStroykaWorker
//
//  Task detail with "Start report" CTA + task chat with manager.
//

import SwiftUI
import Shared

struct TaskDetailView: View {
    let task: TaskDTO
    let projectId: String
    let dayId: String?
    @ObservedObject private var store = AppStateStoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var navigateToReport = false
    @State private var currentUserId: String?

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 12) {
                Text(task.title)
                    .font(.headline)
                if let due = task.dueDate, !due.isEmpty {
                    Text(String(format: NSLocalizedString("worker_task_due_fmt", comment: ""), due))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Text(String(format: NSLocalizedString("worker_task_status_fmt", comment: ""), task.status))
                    .font(.caption)
                    .foregroundColor(.secondary)
                Button(NSLocalizedString("worker_start_report", comment: "")) {
                    store.save { $0.draftTaskId = task.id }
                    navigateToReport = true
                }
                .buttonStyle(.borderedProminent)
                .tint(WorkerSemanticColors.primary)
                .accessibilityIdentifier("pilot_worker_start_report")
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(WorkerSemanticColors.surfaceMuted)

            Divider()

            TaskChatView(
                taskId: task.id,
                currentUserId: currentUserId,
                enqueueOfflineText: WorkerTaskChatActions.enqueueOfflineText
            )
                .accessibilityIdentifier("pilot_worker_task_chat")
        }
        .aistroykaPageBackground(WorkerSemanticColors.pageBackground)
        .navigationTitle(NSLocalizedString("worker_task_title", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $navigateToReport) {
            ReportCreateView(
                projectId: projectId,
                dayId: dayId,
                draftReportId: store.state.draftReportId,
                taskId: task.id,
                taskTitle: task.title
            )
        }
        .task {
            if let session = await AuthService.shared.currentSession() {
                currentUserId = session.user.id
            }
        }
    }
}
