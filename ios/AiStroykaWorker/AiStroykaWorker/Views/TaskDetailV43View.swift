//
//  TaskDetailV43View.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct TaskDetailV43View: View {
    @EnvironmentObject var router: WorkerTabRouter
    let task: TaskDTO
    let projectId: String
    let dayId: String?
    @State private var progress: WorkerTaskProgress
    @State private var currentUserId: String?
    @State private var showWIP = false
    @State private var showCamera = false
    @State private var showChat = false
    @State private var sitePhotoURL: URL?

    init(task: TaskDTO, projectId: String, dayId: String?) {
        self.task = task
        self.projectId = projectId
        self.dayId = dayId
        _progress = State(initialValue: WorkerTaskProgressStore.load(taskId: task.id))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    let priority = WorkerV43Copy.taskPriority(task.priority)
                    WorkerV43StatusPill(text: priority.text, kind: priority.kind, systemImage: "exclamationmark.triangle")
                    WorkerV43StatusPill(text: WorkerV43Copy.taskStatus(task.status), kind: .success)
                    WorkerV43StatusPill(text: task.dueDate ?? NSLocalizedString("wrk_v43_today", comment: ""), kind: .info, systemImage: "clock")
                }
                WorkerV43HeroPhoto(height: 160, systemImage: "building.2.fill", imageURL: sitePhotoURL) {
                    Text(task.title)
                        .font(.caption.weight(.semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .background(.ultraThinMaterial)
                        .clipShape(Capsule())
                }
                HStack {
                    VStack(alignment: .leading) {
                        Text(NSLocalizedString("wrk_v43_manager", comment: ""))
                            .font(.caption)
                            .foregroundStyle(WorkerV43.textSecondary)
                        Text(task.assignedTo ?? "—")
                            .foregroundStyle(WorkerV43.textPrimary)
                    }
                    Spacer()
                    Button { showChat = true } label: {
                        Image(systemName: "bubble.left")
                            .frame(width: 44, height: 44)
                            .background(WorkerV43.card)
                            .clipShape(Circle())
                    }
                    .accessibilityLabel(NSLocalizedString("wrk_v43_tab_messages", comment: ""))
                }
                if let description = task.description, !description.isEmpty {
                    Text(description)
                        .font(.system(size: 14))
                        .foregroundStyle(WorkerV43.textSecondary)
                }
                Text(NSLocalizedString("wrk_v43_what_to_do", comment: ""))
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(WorkerV43.cyan)
                ForEach(0..<5, id: \.self) { idx in
                    HStack {
                        Image(systemName: progress.completedStepIndexes.contains(idx) ? "checkmark.circle.fill" : (idx == progress.completedStepIndexes.count ? "circle.inset.filled" : "circle"))
                            .foregroundStyle(progress.completedStepIndexes.contains(idx) ? WorkerV43.success : WorkerV43.dataBlue)
                        Text(stepTitle(idx))
                            .foregroundStyle(progress.completedStepIndexes.contains(idx) ? WorkerV43.textSecondary : WorkerV43.textPrimary)
                            .strikethrough(progress.completedStepIndexes.contains(idx))
                    }
                }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    meta(NSLocalizedString("wrk_v43_photo_required", comment: ""), "camera", WorkerV43.cyan) {
                        showCamera = true
                    }
                    meta(NSLocalizedString("wrk_v43_preview_doc_kj", comment: ""), "doc.text", WorkerV43.aiViolet) {
                        router.openDocuments()
                    }
                    meta(String(format: NSLocalizedString("wrk_v43_volume_fmt", comment: ""), Int(progress.plannedVolume)), "cube", WorkerV43.dataBlue)
                    meta(String(format: NSLocalizedString("wrk_v43_crew_fmt", comment: ""), progress.crewCount), "person.3", WorkerV43.yellow)
                }
                WorkerV43OutlineButton(
                    title: NSLocalizedString("wrk_v43_report_issue", comment: ""),
                    systemImage: "exclamationmark.triangle",
                    tint: WorkerV43.danger
                ) { router.openIssues(taskId: task.id) }
                WorkerV43PrimaryButton(
                    title: String(format: NSLocalizedString("wrk_v43_continue_step_fmt", comment: ""), min(progress.completedStepIndexes.count + 1, 5), 5)
                ) { showWIP = true }
                .accessibilityIdentifier("pilot_worker_start_report")
            }
            .padding(WorkerV43.screenX)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier("pilot_worker_v43_task_detail")
        .navigationTitle(task.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button(NSLocalizedString("worker_photo_before", comment: "")) { showCamera = true }
                    Button(NSLocalizedString("worker_start_report", comment: "")) { showWIP = true }
                } label: {
                    Image(systemName: "ellipsis")
                }
            }
        }
        .background(
            ZStack {
                NavigationLink(
                    destination: WorkInProgressView(task: task, projectId: projectId, dayId: dayId),
                    isActive: $showWIP
                ) { EmptyView() }
                NavigationLink(
                    destination: CameraEvidenceView(kind: .before, task: task, projectId: projectId, dayId: dayId),
                    isActive: $showCamera
                ) { EmptyView() }
            }
            .hidden()
        )
        .sheet(isPresented: $showChat) {
            NavigationStack {
                WorkerTaskChatScreen(task: task)
            }
        }
        .onAppear {
            if !WorkerV43Preview.isEnabled {
                sitePhotoURL = WorkerV43API.cachedSitePhotoURL(projectId: projectId)
            }
            Task {
                currentUserId = await AuthService.shared.currentSession()?.user.id
                guard !WorkerV43Preview.isEnabled else { return }
                if let photo = try? await WorkerV43API.latestSitePhotoURL(projectId: projectId) {
                    await MainActor.run { sitePhotoURL = photo }
                }
            }
        }
    }

    private func meta(_ title: String, _ image: String, _ tint: Color, action: (() -> Void)? = nil) -> some View {
        Button(action: { action?() }) {
            HStack {
                Image(systemName: image).foregroundStyle(tint)
                Text(title).font(.system(size: 13)).foregroundStyle(WorkerV43.textPrimary)
                Spacer()
            }
            .padding(10)
            .background(WorkerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(action == nil)
    }

    private func stepTitle(_ idx: Int) -> String {
        let keys = [
            "wrk_v43_step_1",
            "wrk_v43_step_2",
            "wrk_v43_step_3",
            "wrk_v43_step_4",
            "wrk_v43_step_5",
        ]
        return NSLocalizedString(keys[idx], comment: "")
    }
}
