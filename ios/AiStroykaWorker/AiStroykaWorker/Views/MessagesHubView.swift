//
//  MessagesHubView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct MessagesHubView: View {
    @EnvironmentObject var router: WorkerTabRouter
    let project: ProjectDTO
    @State private var tasks: [TaskDTO] = []
    @State private var reports: [WorkerSyncReportRow] = []
    @State private var inbox: [WorkerNotificationDTO] = []
    @State private var locallyReadIds: Set<String> = []
    @State private var query = ""
    @State private var loading = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if !NetworkMonitor.shared.isConnected {
                        WorkerV43OfflineBanner(queued: OperationQueueStore.shared.pendingCount())
                    }
                    Text(NSLocalizedString("wrk_v43_messages", comment: ""))
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundStyle(WorkerV43.textPrimary)
                    HStack {
                        ForEach(WorkerMessagesSegment.allCases, id: \.self) { item in
                            WorkerV43Chip(title: segmentLabel(item), selected: router.messagesSegment == item) {
                                router.messagesSegment = item
                            }
                        }
                    }
                    HStack {
                        Image(systemName: "magnifyingglass").foregroundStyle(WorkerV43.textSecondary)
                        TextField(NSLocalizedString("wrk_v43_message_search", comment: ""), text: $query)
                            .foregroundStyle(WorkerV43.textPrimary)
                    }
                    .padding(12)
                    .background(WorkerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    switch router.messagesSegment {
                    case .chats:
                        chatList
                    case .notifications:
                        notificationList
                    case .announcements:
                        WorkerV43EmptyState(
                            title: NSLocalizedString("wrk_v43_announcements_empty", comment: ""),
                            systemImage: "megaphone"
                        )
                    }
                }
                .padding(WorkerV43.screenX)
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { load() }
            .onAppear { load() }
        }
    }

    private var chatList: some View {
        VStack(spacing: 10) {
            if loading && tasks.isEmpty {
                WorkerV43Skeleton(height: 80)
            }
            ForEach(filteredTasks, id: \.id) { task in
                NavigationLink {
                    WorkerTaskChatScreen(task: task)
                } label: {
                    WorkerV43Card {
                        HStack {
                            Circle()
                                .fill(WorkerV43.cardStrong)
                                .frame(width: 44, height: 44)
                                .overlay(Image(systemName: "person.fill").foregroundStyle(WorkerV43.cyan))
                            VStack(alignment: .leading, spacing: 4) {
                                Text(task.title)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(WorkerV43.textPrimary)
                                Text(WorkerV43Copy.taskStatus(task.status))
                                    .font(.caption)
                                    .foregroundStyle(WorkerV43.cyan)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(WorkerV43.textSecondary)
                        }
                    }
                }
                .accessibilityIdentifier("pilot_worker_chat_\(task.id)")
            }
            if filteredTasks.isEmpty && !loading {
                WorkerV43EmptyState(
                    title: NSLocalizedString("wrk_v43_chats_empty", comment: ""),
                    systemImage: "bubble.left"
                )
            }
        }
    }

    private var notificationList: some View {
        VStack(spacing: 10) {
            if inbox.contains(where: isUnread) {
                Button(NSLocalizedString("wrk_v43_mark_all_read", comment: "")) {
                    markAllRead()
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(WorkerV43.cyan)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .accessibilityIdentifier("pilot_worker_mark_all_read")
            }
            ForEach(inbox) { item in
                if item.targetType == "report", let targetId = item.targetId {
                    NavigationLink {
                        ManagerFeedbackResubmitView(reportId: targetId, notificationId: item.id)
                    } label: {
                        inboxCard(title: item.title, detail: item.body, unread: isUnread(item))
                    }
                    .simultaneousGesture(TapGesture().onEnded { markRead(item) })
                } else if item.targetType == "issue", let targetId = item.targetId {
                    NavigationLink {
                        IssueInboxDestination(
                            project: ProjectDTO(id: item.projectId ?? project.id, name: project.name),
                            issueId: targetId
                        )
                    } label: {
                        inboxCard(title: item.title, detail: item.body, unread: isUnread(item))
                    }
                    .simultaneousGesture(TapGesture().onEnded { markRead(item) })
                } else {
                    Button { markRead(item) } label: {
                        inboxCard(title: item.title, detail: item.body, unread: isUnread(item))
                    }
                    .buttonStyle(.plain)
                }
            }
            ForEach(reports) { report in
                NavigationLink {
                    ManagerFeedbackResubmitView(reportId: report.id)
                } label: {
                    inboxCard(
                        title: String(format: NSLocalizedString("worker_feedback_report_fmt", comment: ""), String(report.id.prefix(8))),
                        detail: WorkerV43Copy.reportStatus(report.status)
                    )
                }
            }
            if reports.isEmpty && inbox.isEmpty {
                WorkerV43EmptyState(
                    title: NSLocalizedString("wrk_v43_notifications_empty", comment: ""),
                    systemImage: "bell"
                )
            }
        }
    }

    private func inboxCard(title: String, detail: String?, unread: Bool = false) -> some View {
        WorkerV43Card(borderColor: unread ? WorkerV43.warning.opacity(0.55) : WorkerV43.border) {
            HStack(alignment: .top, spacing: 8) {
                if unread {
                    Circle()
                        .fill(WorkerV43.warning)
                        .frame(width: 8, height: 8)
                        .padding(.top, 6)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).foregroundStyle(WorkerV43.textPrimary)
                    if let detail, !detail.isEmpty {
                        Text(detail)
                            .font(.caption)
                            .foregroundStyle(WorkerV43.warning)
                    }
                }
            }
        }
    }

    private func isUnread(_ item: WorkerNotificationDTO) -> Bool {
        item.readAt == nil && !locallyReadIds.contains(item.id)
    }

    private func markRead(_ item: WorkerNotificationDTO) {
        guard isUnread(item) else { return }
        locallyReadIds.insert(item.id)
        if WorkerInboxBadgeStore.shared.count > 0 {
            WorkerInboxBadgeStore.shared.count -= 1
        }
        guard !WorkerV43Preview.isEnabled else { return }
        Task { await WorkerAPI.markNotificationRead(id: item.id) }
    }

    private func markAllRead() {
        let unreadIds = inbox.filter(isUnread).map(\.id)
        locallyReadIds.formUnion(unreadIds)
        WorkerInboxBadgeStore.shared.count = 0
        guard !WorkerV43Preview.isEnabled else { return }
        Task { await WorkerAPI.markAllNotificationsRead() }
    }

    private var filteredTasks: [TaskDTO] {
        guard !query.isEmpty else { return tasks }
        return tasks.filter { $0.title.localizedCaseInsensitiveContains(query) }
    }

    private func segmentLabel(_ segment: WorkerMessagesSegment) -> String {
        switch segment {
        case .chats: return NSLocalizedString("wrk_v43_chats", comment: "")
        case .notifications: return String(format: NSLocalizedString("wrk_v43_notifications_fmt", comment: ""), reports.count + inbox.count)
        case .announcements: return NSLocalizedString("wrk_v43_announcements", comment: "")
        }
    }

    private func load() {
        if WorkerV43Preview.isEnabled {
            tasks = WorkerV43PreviewCatalog.tasks(projectId: project.id)
            reports = WorkerV43PreviewCatalog.reports()
            WorkerInboxBadgeStore.shared.count = reports.count
            loading = false
            return
        }
        loading = tasks.isEmpty
        Task {
            let list = (try? await WorkerAPI.tasksToday(projectId: project.id)) ?? []
            let sync = (try? await WorkerAPI.workerSync()) ?? []
            let notes = (try? await WorkerAPI.notifications()) ?? []
            let inboxCount = notes.filter { $0.readAt == nil }.count
            await MainActor.run {
                tasks = list
                reports = sync.filter { $0.status == "changes_requested" || $0.status == "submitted" }
                inbox = notes
                WorkerInboxBadgeStore.shared.count = inboxCount
                loading = false
            }
        }
    }
}

struct IssueInboxDestination: View {
    let project: ProjectDTO
    let issueId: String
    @State private var issue: WorkerIssueDTO?
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let issue {
                IssueResolutionView(project: project, issue: issue)
            } else if let errorMessage {
                WorkerV43EmptyState(
                    title: WorkerV43Copy.userFacing(errorMessage),
                    retry: { Task { await load() } }
                )
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .task { await load() }
    }

    private func load() async {
        if WorkerV43Preview.isEnabled {
            let catalog = WorkerV43PreviewCatalog.issues(projectId: project.id)
            issue = catalog.first(where: { $0.id == issueId }) ?? catalog.first
            return
        }
        do {
            issue = try await WorkerV43API.issue(projectId: project.id, issueId: issueId)
        } catch {
            errorMessage = WorkerV43Copy.userFacing(error)
        }
    }
}

struct WorkerTaskChatScreen: View {
    let task: TaskDTO
    @State private var currentUserId: String?
    @State private var previewDraft = ""
    @State private var previewMessages: [String] = []

    var body: some View {
        Group {
            if WorkerV43Preview.isEnabled {
                previewChat
            } else {
                TaskChatView(
                    taskId: task.id,
                    currentUserId: currentUserId,
                    enqueueOfflineText: WorkerTaskChatActions.enqueueOfflineText
                )
            }
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .navigationTitle(task.title)
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("pilot_worker_task_chat")
        .task {
            currentUserId = await AuthService.shared.currentSession()?.user.id
        }
    }

    private var previewChat: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    Text(NSLocalizedString("wrk_v43_preview_chat_local", comment: ""))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                    ForEach(previewMessages, id: \.self) { body in
                        HStack {
                            Spacer()
                            Text(body)
                                .padding(10)
                                .background(WorkerV43.dataBlue)
                                .foregroundStyle(WorkerV43.textPrimary)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }
                }
                .padding(WorkerV43.screenX)
            }
            HStack {
                TextField(NSLocalizedString("wrk_v43_chat_placeholder", comment: ""), text: $previewDraft)
                    .foregroundStyle(WorkerV43.textPrimary)
                Button(NSLocalizedString("worker_done", comment: "")) {
                    let body = previewDraft.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !body.isEmpty else { return }
                    previewMessages.append(body)
                    previewDraft = ""
                }
                .foregroundStyle(WorkerV43.yellow)
            }
            .padding(12)
            .background(WorkerV43.card)
        }
    }
}
