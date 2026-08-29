//
//  TodayHomeView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct TodayHomeView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var router: WorkerTabRouter
    @Environment(\.scenePhase) private var scenePhase
    let project: ProjectDTO
    let onLeaveProject: () -> Void
    @ObservedObject private var store = AppStateStoreManager.shared
    @ObservedObject private var opStore = OperationQueueStore.shared
    @ObservedObject private var syncService = SyncService.shared
    @ObservedObject private var network = NetworkMonitor.shared
    @ObservedObject private var inboxBadgeStore = WorkerInboxBadgeStore.shared
    @State private var todayTasks: [TaskDTO] = []
    @State private var tasksLoading = false
    @State private var errorMessage: String?
    @State private var feedbackReports: [WorkerSyncReportRow] = []
    @State private var unreadChatByTaskId: [String: Bool] = [:]
    @State private var showReport = false
    @State private var resumeDraftReportId: String?
    @State private var assistantSummary: String?
    @State private var sitePhotoURL: URL?

    private var shiftStarted: Bool {
        WorkerV43Preview.isEnabled || store.state.shift.isStarted
    }
    private var dayId: String? { store.state.shift.dayId }
    private var mainTask: TaskDTO? { todayTasks.first }
    private var nextTasks: [TaskDTO] { Array(todayTasks.dropFirst().prefix(2)) }

    var body: some View {
        NavigationStack {
            Group {
                if tasksLoading && todayTasks.isEmpty {
                    ScrollView {
                        VStack(spacing: 12) {
                            WorkerV43Skeleton(height: 72)
                            WorkerV43Skeleton(height: 180)
                            WorkerV43Skeleton(height: 96)
                        }
                        .padding(WorkerV43.screenX)
                    }
                } else if let errorMessage, todayTasks.isEmpty {
                    WorkerV43EmptyState(
                        title: WorkerV43Copy.userFacing(errorMessage),
                        detail: NSLocalizedString("wrk_v43_cached_if_any", comment: ""),
                        retry: { load() }
                    )
                } else {
                    content
                }
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { load() }
            .onAppear {
                let cached = store.state.cachedTodayTasks(forUserId: KeychainHelper.get(key: KeychainHelper.sessionUserIdKey))
                if todayTasks.isEmpty, !cached.isEmpty {
                    todayTasks = cached
                }
                if !WorkerV43Preview.isEnabled {
                    sitePhotoURL = WorkerV43API.cachedSitePhotoURL(projectId: project.id)
                }
                load()
            }
            .onChange(of: scenePhase) { phase in
                if phase == .active { load() }
            }
            .sheet(isPresented: $showReport) {
                NavigationStack {
                    DailyReportFormView(
                        projectId: project.id,
                        dayId: dayId,
                        draftReportId: resumeDraftReportId,
                        taskId: store.state.draftTaskId,
                        taskTitle: mainTask?.title
                    )
                }
                .accessibilityIdentifier("pilot_worker_report_compose_sheet")
            }
        }
        .accessibilityIdentifier("pilot_worker_home_scroll")
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                if !network.isConnected {
                    WorkerV43OfflineBanner(queued: opStore.pendingCount(), retry: { load() })
                }
                projectCard
                if let assistantSummary, WorkerSettingsStore.load().aiAssistant {
                    WorkerV43Card(borderColor: WorkerV43.aiViolet.opacity(0.45), fill: WorkerV43.aiViolet.opacity(0.12)) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(NSLocalizedString("wrk_v43_assistant", comment: ""))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(WorkerV43.aiViolet)
                            Text(assistantSummary)
                                .font(.system(size: 14))
                                .foregroundStyle(WorkerV43.textPrimary)
                        }
                    }
                }
                mainTaskCard
                quickActions
                if !nextTasks.isEmpty {
                    nextSection
                }
                if !feedbackReports.isEmpty {
                    feedbackSection
                }
                WorkerV43SyncPill(status: WorkerSyncLabel.from(status: syncService.status, lastSync: nil).0)
            }
            .padding(.horizontal, WorkerV43.screenX)
            .padding(.bottom, 24)
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 0) {
                    Text("AISTROYKA").font(.system(size: 13, weight: .semibold)).foregroundStyle(WorkerV43.textPrimary)
                    Text(".AI").font(.system(size: 13, weight: .semibold)).foregroundStyle(WorkerV43.yellow)
                }
                Text(greeting)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                HStack(spacing: 6) {
                    Image(systemName: "calendar")
                    Text(String(format: NSLocalizedString("wrk_v43_today_date_fmt", comment: ""), WorkerV43Formatters.dayTitle(Date())))
                }
                .font(.system(size: 13))
                .foregroundStyle(WorkerV43.textSecondary)
            }
            Spacer()
            Button { router.openMessages() } label: {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .foregroundStyle(WorkerV43.textPrimary)
                        .frame(width: 40, height: 40)
                        .background(WorkerV43.cardStrong)
                        .clipShape(Circle())
                    if inboxBadge > 0 {
                        Text(inboxBadge > 99 ? "99+" : "\(inboxBadge)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(4)
                            .background(WorkerV43.danger)
                            .clipShape(Circle())
                            .offset(x: 4, y: -2)
                    }
                }
            }
            .accessibilityLabel(NSLocalizedString("wrk_v43_tab_messages", comment: ""))
        }
    }

    private var inboxBadge: Int {
        if inboxBadgeStore.count > 0 { return inboxBadgeStore.count }
        return feedbackReports.count
    }

    private var displayName: String {
        if WorkerV43Preview.isEnabled {
            return NSLocalizedString("wrk_v43_preview_worker_name", comment: "")
        }
        return appState.currentUser?.split(separator: "@").first.map(String.init) ?? NSLocalizedString("wrk_v43_worker", comment: "")
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let key: String
        if hour < 12 {
            key = "wrk_v43_greeting_morning_fmt"
        } else if hour < 18 {
            key = "wrk_v43_greeting_day_fmt"
        } else {
            key = "wrk_v43_greeting_evening_fmt"
        }
        return String(format: NSLocalizedString(key, comment: ""), displayName)
    }

    private var projectCard: some View {
        WorkerV43HeroPhoto(height: 132, systemImage: "building.2.fill", imageURL: sitePhotoURL) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text(project.name ?? project.id)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    HStack(spacing: 6) {
                        Circle().fill(shiftStarted ? WorkerV43.success : WorkerV43.warning).frame(width: 8, height: 8)
                        Text(shiftStarted ? NSLocalizedString("wrk_v43_on_site", comment: "") : NSLocalizedString("worker_shift_not_started", comment: ""))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(shiftStarted ? WorkerV43.success : WorkerV43.warning)
                    }
                }
                Spacer()
                Button(action: onLeaveProject) {
                    Image(systemName: "chevron.right")
                        .foregroundStyle(WorkerV43.textPrimary)
                }
                .accessibilityLabel(NSLocalizedString("worker_nav_projects", comment: ""))
            }
        }
        .overlay(alignment: .topLeading) {
            Color.clear
                .frame(width: 1, height: 1)
                .accessibilityIdentifier("pilot_worker_site_photo")
        }
    }

    @ViewBuilder
    private var mainTaskCard: some View {
        if !shiftStarted {
            WorkerV43Card(borderColor: WorkerV43.yellow.opacity(0.5)) {
                VStack(alignment: .leading, spacing: 12) {
                    Text(NSLocalizedString("wrk_v43_shift_needed", comment: ""))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    WorkerV43PrimaryButton(title: NSLocalizedString("worker_start_shift", comment: "")) {
                        router.openShiftStart = true
                    }
                    .accessibilityIdentifier("pilot_worker_start_shift")
                }
            }
        } else if let task = mainTask {
            WorkerV43Card(borderColor: WorkerV43.dataBlue.opacity(0.55)) {
                VStack(alignment: .leading, spacing: 10) {
                    Text(NSLocalizedString("wrk_v43_main_task", comment: ""))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(WorkerV43.cyan)
                    Text(task.title)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                        .accessibilityIdentifier("pilot_worker_v43_main_task")
                    let priority = WorkerV43Copy.taskPriority(task.priority)
                    HStack(spacing: 8) {
                        Image(systemName: "mappin.and.ellipse")
                        Text(project.name ?? NSLocalizedString("wrk_v43_today", comment: ""))
                        Image(systemName: "clock")
                        Text(task.dueDate ?? NSLocalizedString("wrk_v43_today", comment: ""))
                        WorkerV43StatusPill(
                            text: priority.text,
                            kind: priority.kind,
                            systemImage: "exclamationmark.triangle"
                        )
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(WorkerV43.textSecondary)
                    let progress = WorkerTaskProgressStore.load(taskId: task.id)
                    HStack {
                        Text(String(format: NSLocalizedString("wrk_v43_steps_fmt", comment: ""), progress.completedStepIndexes.count, 5))
                        Spacer()
                        Text(WorkerV43Formatters.percentLabel(progress.progress))
                    }
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(WorkerV43.textSecondary)
                    ProgressView(value: progress.progress)
                        .tint(WorkerV43.dataBlue)
                    NavigationLink {
                        TaskDetailV43View(task: task, projectId: project.id, dayId: dayId)
                    } label: {
                        Text(NSLocalizedString("wrk_v43_continue_work", comment: ""))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(WorkerV43.yellowInk)
                            .frame(maxWidth: .infinity)
                            .frame(minHeight: WorkerV43.ctaHeight)
                            .background(WorkerV43.yellow)
                            .clipShape(RoundedRectangle(cornerRadius: WorkerV43.radiusControl, style: .continuous))
                    }
                    .accessibilityIdentifier("pilot_worker_task_\(task.id)")
                }
            }
        } else {
            WorkerV43EmptyState(
                title: NSLocalizedString("wrk_v43_no_tasks_today", comment: ""),
                detail: NSLocalizedString("wrk_v43_no_tasks_today_detail", comment: ""),
                systemImage: "checkmark.circle"
            )
        }
    }

    private var quickActions: some View {
        HStack(spacing: 10) {
            quick(
                "camera.fill",
                NSLocalizedString("wrk_v43_quick_photo", comment: ""),
                NSLocalizedString("wrk_v43_quick_photo_sub", comment: ""),
                WorkerV43.dataBlue
            ) {
                router.openCameraContext = true
            }
            .accessibilityIdentifier("pilot_worker_quick_photo")
            quick(
                "exclamationmark.triangle.fill",
                NSLocalizedString("wrk_v43_quick_issue", comment: ""),
                NSLocalizedString("wrk_v43_quick_issue_sub", comment: ""),
                WorkerV43.warning
            ) {
                router.openIssues()
            }
            .accessibilityIdentifier("pilot_worker_quick_issue")
            quick(
                "doc.text.fill",
                NSLocalizedString("wrk_v43_quick_drawing", comment: ""),
                NSLocalizedString("wrk_v43_quick_drawing_sub", comment: ""),
                WorkerV43.aiViolet
            ) {
                router.openDocuments()
            }
            .accessibilityIdentifier("pilot_worker_quick_drawing")
        }
    }

    private func quick(_ image: String, _ title: String, _ subtitle: String, _ tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: image).foregroundStyle(tint)
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                    .multilineTextAlignment(.leading)
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundStyle(WorkerV43.textSecondary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
            }
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: 104, alignment: .topLeading)
            .background(WorkerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var nextSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("wrk_v43_next_today", comment: ""))
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
            ForEach(nextTasks, id: \.id) { task in
                NavigationLink {
                    TaskDetailV43View(task: task, projectId: project.id, dayId: dayId)
                } label: {
                    HStack {
                        Image(systemName: "clock").foregroundStyle(WorkerV43.cyan)
                        VStack(alignment: .leading) {
                            Text(task.title).foregroundStyle(WorkerV43.textPrimary)
                            Text(task.dueDate ?? task.status).font(.caption).foregroundStyle(WorkerV43.textSecondary)
                        }
                        Spacer()
                        if unreadChatByTaskId[task.id] == true {
                            Circle().fill(WorkerV43.yellow).frame(width: 8, height: 8)
                        }
                        Image(systemName: "chevron.right").foregroundStyle(WorkerV43.textSecondary)
                    }
                    .padding(12)
                    .background(WorkerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .accessibilityIdentifier("pilot_worker_task_\(task.id)")
            }
        }
    }

    private var feedbackSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("worker_feedback_section_title", comment: ""))
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
            ForEach(feedbackReports) { r in
                NavigationLink {
                    ManagerFeedbackResubmitView(reportId: r.id)
                } label: {
                    HStack {
                        Text(String(format: NSLocalizedString("worker_feedback_report_fmt", comment: ""), String(r.id.prefix(8))))
                            .foregroundStyle(WorkerV43.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(WorkerV43.textSecondary)
                    }
                    .padding(12)
                    .background(WorkerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .accessibilityIdentifier("pilot_worker_feedback_\(r.id)")
            }
        }
    }

    private func load() {
        errorMessage = nil
        if WorkerV43Preview.isEnabled {
            todayTasks = WorkerV43PreviewCatalog.tasks(projectId: project.id)
            feedbackReports = WorkerV43PreviewCatalog.reports()
            WorkerInboxBadgeStore.shared.count = feedbackReports.count
            tasksLoading = false
            return
        }
        tasksLoading = todayTasks.isEmpty
        OperationQueueExecutor.shared.runLoop()
        if syncService.status == .idle || syncService.status == .offline {
            syncService.runSyncIfOnline()
        }
        Task {
            do {
                let list = try await WorkerAPI.tasksToday(projectId: project.id)
                var unread: [String: Bool] = [:]
                for t in list.prefix(20) {
                    do {
                        let msgs = try await TaskMessagesAPI.listAll(taskId: t.id, pageSize: 20, maxPages: 1)
                        unread[t.id] = TaskChatReadStore.isUnread(taskId: t.id, latestCreatedAt: msgs.last?.createdAt)
                    } catch {
                        unread[t.id] = false
                    }
                }
                let reports = (try? await WorkerAPI.workerSync()) ?? []
                let inboxCount = (try? await WorkerAPI.unreadNotificationCount()) ?? 0
                let photo = try? await WorkerV43API.latestSitePhotoURL(projectId: project.id)
                let assistant: String?
                if WorkerSettingsStore.load().aiAssistant {
                    let locale = Self.helpLocale()
                    let activation = try? await WorkerAPI.activationStatus()
                    assistant = (try? await WorkerAPI.helpAssistant(
                        query: "",
                        locale: locale,
                        role: AppRuntime.helpHintsLaunchRoleForWorkerApp,
                        pathname: "/worker",
                        activation: activation
                    ))?.summary
                    await WorkerAPI.helpAssistantEvent(
                        type: "open",
                        locale: locale,
                        role: AppRuntime.helpAssistantEventRoleWorker,
                        pathname: "/worker"
                    )
                } else {
                    assistant = nil
                }
                await MainActor.run {
                    todayTasks = list
                    unreadChatByTaskId = unread
                    feedbackReports = reports.filter { $0.status == "changes_requested" }
                    WorkerInboxBadgeStore.shared.count = inboxCount
                    assistantSummary = assistant
                    if let photo { sitePhotoURL = photo }
                    tasksLoading = false
                    errorMessage = nil
                    if let userId = KeychainHelper.get(key: KeychainHelper.sessionUserIdKey) {
                        store.save { $0.replaceCachedTodayTasks(list, userId: userId) }
                    }
                }
            } catch {
                await MainActor.run {
                    if todayTasks.isEmpty {
                        todayTasks = store.state.cachedTodayTasks(forUserId: KeychainHelper.get(key: KeychainHelper.sessionUserIdKey))
                    }
                    tasksLoading = false
                    if todayTasks.isEmpty {
                        errorMessage = WorkerV43Copy.userFacing(error)
                    }
                }
            }
        }
    }

    private static func helpLocale() -> String {
        let language = String((Locale.preferredLanguages.first ?? "en").prefix(2)).lowercased()
        return ["ru", "es", "it"].contains(language) ? language : "en"
    }
}
