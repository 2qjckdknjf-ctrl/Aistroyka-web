//
//  TaskDetailView.swift
//  AiStroykaWorker
//
//  Phase 7.5 — Task detail with "Start report" CTA; links report draft to task via draftTaskId.
//

import SwiftUI

struct TaskDetailView: View {
    let task: TaskDTO
    let projectId: String
    let dayId: String?
    @ObservedObject private var store = AppStateStoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var navigateToReport = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(task.title)
                .font(.headline)
            if let due = task.dueDate, !due.isEmpty {
                Text("Due: \(due)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            Text("Status: \(task.status)")
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer().frame(height: 8)
            Button("Start report") {
                store.save { $0.draftTaskId = task.id }
                navigateToReport = true
            }
            .buttonStyle(.borderedProminent)
            Spacer()
        }
        .padding()
        .navigationTitle("Task")
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
    }
}
