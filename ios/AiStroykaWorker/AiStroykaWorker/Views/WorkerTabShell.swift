//
//  WorkerTabShell.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct WorkerTabShell: View {
    @EnvironmentObject var appState: AppState
    let project: ProjectDTO
    let onLogout: () -> Void
    let onLeaveProject: () -> Void
    @StateObject private var router = WorkerTabRouter()
    @ObservedObject private var store = AppStateStoreManager.shared
    @ObservedObject private var network = NetworkMonitor.shared
    @ObservedObject private var opStore = OperationQueueStore.shared

    var body: some View {
        ZStack(alignment: .bottom) {
            tabContent
                .padding(.bottom, WorkerV43.tabBarHeight)
            WorkerV43TabBar(
                selected: $router.selectedTab,
                cameraAction: { router.openCameraContext = true }
            )
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .environmentObject(router)
        .sheet(isPresented: $router.openCameraContext) {
            CameraContextSheet(project: project)
                .environmentObject(router)
                .presentationDetents([.medium])
        }
        .fullScreenCover(isPresented: $router.openShiftStart) {
            ShiftStartSafetyView(project: project) {
                router.openShiftStart = false
            }
        }
        .fullScreenCover(item: $router.previewSurface) { surface in
            previewCover(surface)
        }
        .preferredColorScheme(.dark)
        .onAppear {
            applyLaunchScreen()
            refreshUnreadInbox()
        }
        .overlay(alignment: .topLeading) {
            Color.clear
                .frame(width: 8, height: 8)
                .accessibilityIdentifier(WorkerV43Preview.showsCatalogWithoutAuth ? "pilot_worker_v43_catalog" : "pilot_worker_home")
                .accessibilityLabel(WorkerV43Preview.showsCatalogWithoutAuth ? "v43-catalog" : "v43-home")
        }
    }

    private func refreshUnreadInbox() {
        guard !WorkerV43Preview.isEnabled else { return }
        Task {
            let count = (try? await WorkerAPI.unreadNotificationCount()) ?? 0
            await MainActor.run { WorkerInboxBadgeStore.shared.count = count }
        }
    }

    private func applyLaunchScreen() {
        let raw = ProcessInfo.processInfo.environment["AISTROYKA_WORKER_V43_SCREEN"]
            ?? UserDefaults.standard.string(forKey: "AISTROYKA_WORKER_V43_SCREEN")
        switch raw?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "shift":
            router.openShiftStart = true
        case "issues":
            router.openIssues()
        case "documents":
            router.openDocuments()
        case "reports", "report":
            router.previewSurface = .report
        case "task":
            router.openTask("preview-task-1")
        case "before", "camera":
            router.previewSurface = .before
        case "after":
            router.previewSurface = .after
        case "wip":
            router.previewSurface = .wip
        case "review":
            router.previewSurface = .review
        case "feedback":
            router.previewSurface = .feedback
        case "issue":
            router.previewSurface = .issue
        default:
            break
        }
    }

    @ViewBuilder
    private func previewCover(_ surface: WorkerV43PreviewSurface) -> some View {
        let task = WorkerV43PreviewCatalog.tasks(projectId: project.id)[0]
        let issue = WorkerV43PreviewCatalog.issues(projectId: project.id)[0]
        NavigationStack {
            Group {
                switch surface {
                case .before:
                    CameraEvidenceView(kind: .before, task: task, projectId: project.id, dayId: store.state.shift.dayId)
                case .after:
                    CameraEvidenceView(kind: .after, task: task, projectId: project.id, dayId: store.state.shift.dayId)
                case .wip:
                    WorkInProgressView(task: task, projectId: project.id, dayId: store.state.shift.dayId)
                case .review:
                    ReportReviewSubmitView(
                        projectId: project.id,
                        dayId: store.state.shift.dayId,
                        draftReportId: nil,
                        taskId: task.id,
                        taskTitle: task.title
                    )
                case .feedback:
                    ManagerFeedbackResubmitView(reportId: WorkerV43PreviewCatalog.reports()[0].id)
                case .issue:
                    IssueResolutionView(project: project, issue: issue)
                case .report:
                    DailyReportFormView(
                        projectId: project.id,
                        dayId: store.state.shift.dayId,
                        draftReportId: nil,
                        taskId: task.id,
                        taskTitle: task.title
                    )
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("worker_cancel", comment: "")) {
                        router.previewSurface = nil
                    }
                    .foregroundStyle(WorkerV43.yellow)
                }
            }
            .overlay(alignment: .topLeading) {
                Color.clear
                    .frame(width: 8, height: 8)
                    .accessibilityIdentifier("pilot_worker_preview_\(surface.rawValue)")
                    .accessibilityLabel(surface.rawValue)
            }
        }
    }

    @ViewBuilder
    private var tabContent: some View {
        switch router.selectedTab {
        case .today:
            TodayHomeView(project: project, onLeaveProject: onLeaveProject)
        case .tasks:
            MyTasksView(project: project)
        case .messages:
            MessagesHubView(project: project)
        case .more:
            ProfileOfflineSettingsView(
                project: project,
                onLogout: onLogout,
                onLeaveProject: onLeaveProject
            )
        }
    }
}

struct CameraContextSheet: View {
    @EnvironmentObject var router: WorkerTabRouter
    @Environment(\.dismiss) private var dismiss
    let project: ProjectDTO
    @ObservedObject private var store = AppStateStoreManager.shared
    @State private var tasks: [TaskDTO] = []
    @State private var showTaskCamera = false

    private var cameraTask: TaskDTO? {
        if let draft = store.state.draftTaskId {
            return tasks.first(where: { $0.id == draft }) ?? tasks.first
        }
        return tasks.first
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 12) {
                Text(NSLocalizedString("wrk_v43_camera_context_title", comment: ""))
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                contextRow(
                    title: NSLocalizedString("wrk_v43_camera_context_task", comment: ""),
                    image: "camera.viewfinder",
                    tint: WorkerV43.dataBlue,
                    accessibilityId: "pilot_worker_camera_context_task"
                ) {
                    router.cameraContext = .task
                    if cameraTask != nil {
                        showTaskCamera = true
                    } else {
                        router.selectedTab = .tasks
                        dismiss()
                    }
                }
                contextRow(
                    title: NSLocalizedString("wrk_v43_camera_context_report", comment: ""),
                    image: "doc.viewfinder",
                    tint: WorkerV43.cyan,
                    accessibilityId: "pilot_worker_camera_context_report"
                ) {
                    router.cameraContext = .report
                    router.openReports()
                    dismiss()
                }
                contextRow(
                    title: NSLocalizedString("wrk_v43_camera_context_issue", comment: ""),
                    image: "exclamationmark.triangle",
                    tint: WorkerV43.warning,
                    accessibilityId: "pilot_worker_camera_context_issue"
                ) {
                    router.cameraContext = .issue
                    router.openIssues()
                    dismiss()
                }
                Spacer()
            }
            .padding(WorkerV43.screenX)
            .background(WorkerV43.bg.ignoresSafeArea())
            .overlay(alignment: .topLeading) {
                Color.clear
                    .frame(width: 1, height: 1)
                    .accessibilityIdentifier("pilot_worker_camera_context")
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("worker_cancel", comment: "")) { dismiss() }
                        .foregroundStyle(WorkerV43.yellow)
                        .accessibilityIdentifier("pilot_worker_camera_context_cancel")
                }
            }
            .background(
                NavigationLink(
                    destination: Group {
                        if let task = cameraTask {
                            CameraEvidenceView(
                                kind: .before,
                                task: task,
                                projectId: project.id,
                                dayId: store.state.shift.dayId
                            )
                        }
                    },
                    isActive: $showTaskCamera
                ) { EmptyView() }
                .hidden()
            )
            .onAppear { loadTasks() }
        }
    }

    private func loadTasks() {
        if WorkerV43Preview.isEnabled {
            tasks = WorkerV43PreviewCatalog.tasks(projectId: project.id)
            return
        }
        Task {
            let list = (try? await WorkerAPI.tasksToday(projectId: project.id)) ?? []
            await MainActor.run { tasks = list }
        }
    }

    private func contextRow(title: String, image: String, tint: Color, accessibilityId: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: image)
                    .foregroundStyle(tint)
                    .frame(width: 36, height: 36)
                    .background(tint.opacity(0.16))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(WorkerV43.textSecondary)
            }
            .padding(14)
            .background(WorkerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
        .frame(minHeight: WorkerV43.fieldTouch)
        .accessibilityIdentifier(accessibilityId)
    }
}
