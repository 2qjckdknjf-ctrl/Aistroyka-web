//
//  HomeDashboardView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct HomeDashboardView: View {
    @EnvironmentObject var router: ManagerTabRouter
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @State private var overview: OpsOverviewDTO?
    @State private var activationStatus: ActivationStatusDTO?
    @State private var helpHints: [HelpHintDTO] = []
    @State private var guideSummary: String?
    @State private var guideConfidence: Int?
    @State private var guideRiskSignals: [HelpAssistantRiskSignalDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var todayTasks: [TaskDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var lastSync: Date?
    @State private var featuredEstimate: ProjectEstimateSummaryDTO?
    @State private var reviewReportsCount = 0
    @State private var workspaceName: String?
    @State private var openedReportId: String?
    @State private var openedTaskId: String?
    @State private var openedProjectId: String?
    @State private var openedDocumentsProjectId: String?
    @State private var workloadItems: [WorkloadItemDTO] = []
    @AppStorage("mgr.v43.aiAssistantOn") private var aiAssistantOn = true

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && overview == nil && projects.isEmpty {
                    ScrollView {
                        VStack(spacing: 12) {
                            ManagerSkeletonBlock(height: 72)
                            ManagerSkeletonBlock(height: 220)
                            ManagerSkeletonBlock(height: 96)
                        }
                        .padding(ManagerV43.screenX)
                    }
                } else if let err = errorMessage, overview == nil && projects.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else {
                    content
                }
            }
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await loadAsync() }
            .onAppear {
                if reviewReportsCount == 0, let cached = ManagerCacheStore.load([ReportListItemDTO].self, key: "mgr.v43.reports") {
                    reviewReportsCount = cached.filter { ManagerV43Formatters.reportQueueBucket(from: $0.status) == "review" }.count
                }
                loadIfNeeded()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.reportsChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.tasksChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.notificationsChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.projectsChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.workspaceChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.aiAssistantChanged)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
                load()
            }
            .onChange(of: aiAssistantOn) { _ in
                load()
            }
            .navigationDestination(isPresented: Binding(
                get: { openedReportId != nil },
                set: { if !$0 { openedReportId = nil } }
            )) {
                if let id = openedReportId {
                    ReportDetailReviewView(reportId: id)
                }
            }
            .navigationDestination(isPresented: Binding(
                get: { openedTaskId != nil },
                set: { if !$0 { openedTaskId = nil } }
            )) {
                if let id = openedTaskId {
                    TaskDetailManagerView(taskId: id)
                }
            }
            .navigationDestination(isPresented: Binding(
                get: { openedProjectId != nil },
                set: { if !$0 { openedProjectId = nil } }
            )) {
                if let id = openedProjectId {
                    let name = workloadItems.first(where: { $0.projectId == id })?.projectName
                        ?? projects.first(where: { $0.id == id })?.name
                    ProjectDetailView(projectId: id, projectName: name)
                }
            }
            .navigationDestination(isPresented: Binding(
                get: { openedDocumentsProjectId != nil },
                set: { if !$0 { openedDocumentsProjectId = nil } }
            )) {
                DocumentsHubView(initialProjectId: openedDocumentsProjectId)
            }
        }
    }

    private var featured: ProjectDTO? { projects.first }
    private var greetingName: String {
        NSLocalizedString("mgr_v43_home_greeting", comment: "")
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                if !networkMonitor.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                        .padding(.horizontal, ManagerV43.screenX)
                }
                featuredCard
                attentionRow
                workloadSection
                getStartedSection
                todaySection
                aiSummaryCard
            }
            .padding(.bottom, 24)
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 0) {
                    Text("AISTROYKA")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                    Text(".AI")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(ManagerV43.yellow)
                }
                Text(greetingName)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                if let workspaceName, !workspaceName.isEmpty {
                    Text(workspaceName)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ManagerV43.textSecondary)
                }
                Label(todayLabel, systemImage: "calendar")
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
            }
            Spacer()
            Button { router.selectedTab = .more; router.openNotifications = true } label: {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .foregroundStyle(ManagerV43.textPrimary)
                        .frame(width: ManagerV43.touch, height: ManagerV43.touch)
                    if router.notificationsBadge > 0 {
                        Circle().fill(ManagerV43.danger).frame(width: 8, height: 8).offset(x: -10, y: 10)
                    }
                }
            }
            .accessibilityLabel(NSLocalizedString("mgr_notifications", comment: ""))
            Circle()
                .fill(ManagerV43.cardStrong)
                .frame(width: 36, height: 36)
                .overlay(Image(systemName: "person.fill").foregroundStyle(ManagerV43.textSecondary))
        }
        .padding(.horizontal, ManagerV43.screenX)
        .padding(.top, 8)
    }

    private var todayLabel: String {
        let f = DateFormatter()
        f.dateStyle = .medium
        return String(format: NSLocalizedString("mgr_v43_today_fmt", comment: ""), f.string(from: Date()))
    }

    private var featuredCard: some View {
        let name = featured?.name ?? (ManagerV43Preview.isEnabled ? ManagerDemoCatalog.featuredProjectName : NSLocalizedString("mgr_v43_no_project", comment: ""))
        let progress = displayedProgress
        return VStack(alignment: .leading, spacing: 12) {
            ZStack(alignment: .bottomLeading) {
                ManagerSiteImage(height: 148)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(name)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(.white)
                        if featured != nil && ManagerV43Preview.isEnabled {
                            ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_in_progress", comment: ""), kind: .success)
                        }
                    }
                }
                .padding(16)
            }
            HStack(alignment: .center, spacing: 16) {
                if let progress {
                    ManagerProgressRing(progress: progress, size: 92)
                }
                VStack(alignment: .leading, spacing: 8) {
                    if let budget = displayedBudget {
                        Text(NSLocalizedString("mgr_v43_project_budget", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        Text(ManagerV43Formatters.compactCurrency(budget, currencyCode: featuredEstimate?.budgetSummary?.currency ?? "RUB"))
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(ManagerV43.textPrimary)
                    }
                    if let variance = displayedVariance {
                        Text(NSLocalizedString("mgr_v43_budget_variance", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        Text(ManagerV43Formatters.compactCurrency(variance, currencyCode: featuredEstimate?.budgetSummary?.currency ?? "RUB"))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle((featuredEstimate?.budgetSummary?.overBudget == true) ? ManagerV43.warning : ManagerV43.success)
                    }
                    if let delay = displayedDelay {
                        Text(NSLocalizedString("mgr_v43_schedule_variance", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                        Text(ManagerV43Formatters.delayLabel(days: delay))
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(delay == 0 ? ManagerV43.success : ManagerV43.warning)
                    }
                }
                Spacer()
            }
            if let featured {
                NavigationLink(destination: ProjectDetailView(projectId: featured.id, projectName: featured.name)) {
                    Text(NSLocalizedString("mgr_v43_open_project", comment: ""))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(ManagerV43.yellowInk)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: ManagerV43.touch)
                        .background(ManagerV43.yellow)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .accessibilityIdentifier("pilot_manager_home_open_project")
            }
        }
        .padding(12)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding(.horizontal, ManagerV43.screenX)
    }

    private var displayedProgress: Double? {
        if ManagerV43Preview.isEnabled { return ManagerDemoCatalog.featuredProgress }
        if let planned = featuredEstimate?.budgetSummary?.plannedTotal, planned > 0,
           let actual = featuredEstimate?.budgetSummary?.actualTotal {
            return ManagerV43Formatters.clampedProgress(actual / planned)
        }
        let open = overview?.kpis?.tasksOpenToday ?? 0
        let done = overview?.kpis?.tasksCompletedToday ?? 0
        let total = open + done
        guard total > 0 else { return nil }
        return Double(done) / Double(total)
    }

    private var displayedBudget: Double? {
        if ManagerV43Preview.isEnabled { return ManagerDemoCatalog.featuredBudget }
        return featuredEstimate?.budgetSummary?.plannedTotal
    }

    private var displayedDelay: Int? {
        ManagerV43Preview.isEnabled ? ManagerDemoCatalog.featuredDelayDays : nil
    }

    private var displayedVariance: Double? {
        if ManagerV43Preview.isEnabled { return nil }
        return featuredEstimate?.budgetSummary?.varianceAmount
    }

    private var attentionRow: some View {
        let reports = reviewReportsCount > 0
            ? reviewReportsCount
            : (overview?.queues?.reportsPendingReview?.count ?? 0)
        let overdue = overview?.kpis?.tasksOverdue ?? 0
        let risks = guideRiskSignals.count
        return VStack(alignment: .leading, spacing: 10) {
            Text(NSLocalizedString("mgr_needs_attention", comment: ""))
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(ManagerV43.textPrimary)
                .padding(.horizontal, ManagerV43.screenX)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    attentionCard(
                        icon: "doc.text",
                        tint: ManagerV43.dataBlue,
                        title: String(format: NSLocalizedString("mgr_v43_reports_review_fmt", comment: ""), reports),
                        subtitle: NSLocalizedString("mgr_v43_reports_review_sub", comment: "")
                    ) { openAttentionReports() }
                    attentionCard(
                        icon: "exclamationmark.triangle.fill",
                        tint: ManagerV43.danger,
                        title: String(format: NSLocalizedString("mgr_v43_high_risks_fmt", comment: ""), max(risks, ManagerV43Preview.showsCatalogWithoutAuth ? 3 : 0)),
                        subtitle: NSLocalizedString("mgr_v43_high_risks_sub", comment: "")
                    ) { router.selectedTab = .ai }
                    attentionCard(
                        icon: "clock.badge.exclamationmark",
                        tint: ManagerV43.yellow,
                        title: String(format: NSLocalizedString("mgr_v43_overdue_fmt", comment: ""), overdue),
                        subtitle: NSLocalizedString("mgr_v43_overdue_sub", comment: "")
                    ) { openAttentionOverdue() }
                }
                .padding(.horizontal, ManagerV43.screenX)
            }
        }
    }

    private func attentionCard(icon: String, tint: Color, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: icon).foregroundStyle(tint)
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .multilineTextAlignment(.leading)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
                    .lineLimit(2)
            }
            .padding(12)
            .frame(width: 168, alignment: .leading)
            .background(ManagerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func openAttentionReports() {
        if let id = overview?.queues?.reportsPendingReview?.first?.id, !id.isEmpty {
            openedReportId = id
        } else {
            router.openReportsReview()
        }
    }

    private var workloadSection: some View {
        Group {
            if !workloadItems.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text(NSLocalizedString("mgr_v43_workload", comment: ""))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                    ForEach(workloadItems.prefix(5)) { item in
                        Button { openWorkload(item) } label: {
                            HStack(alignment: .top, spacing: 10) {
                                Circle()
                                    .fill(workloadTint(item.priority))
                                    .frame(width: 8, height: 8)
                                    .padding(.top, 6)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.title ?? NSLocalizedString("mgr_v43_workload", comment: ""))
                                        .font(.system(size: 15, weight: .semibold))
                                        .foregroundStyle(ManagerV43.textPrimary)
                                        .multilineTextAlignment(.leading)
                                    if let reason = item.reason, !reason.isEmpty {
                                        Text(reason)
                                            .font(.caption)
                                            .foregroundStyle(ManagerV43.textSecondary)
                                            .lineLimit(2)
                                    } else if let name = item.projectName, !name.isEmpty {
                                        Text(name)
                                            .font(.caption)
                                            .foregroundStyle(ManagerV43.textSecondary)
                                            .lineLimit(1)
                                    }
                                }
                                Spacer(minLength: 0)
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(ManagerV43.textSecondary)
                            }
                            .padding(12)
                            .background(ManagerV43.card)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, ManagerV43.screenX)
                .accessibilityIdentifier("pilot_manager_home_workload")
            }
        }
    }

    private func workloadTint(_ priority: String?) -> Color {
        switch (priority ?? "").lowercased() {
        case "urgent": return ManagerV43.danger
        case "high": return ManagerV43.yellow
        default: return ManagerV43.dataBlue
        }
    }

    private func openWorkload(_ item: WorkloadItemDTO) {
        let kind = (item.kind ?? "").lowercased()
        if kind == "pending_reports_queue" {
            openAttentionReports()
            return
        }
        if kind == "pending_document_decisions", let projectId = item.projectId, !projectId.isEmpty {
            openedDocumentsProjectId = projectId
            return
        }
        if let entity = item.linkedEntityType?.lowercased(),
           let entityId = item.linkedEntityId, !entityId.isEmpty {
            switch entity {
            case "report":
                openedReportId = entityId
                return
            case "task":
                openedTaskId = entityId
                return
            case "project":
                openedProjectId = entityId
                return
            default:
                break
            }
        }
        if let projectId = item.projectId, !projectId.isEmpty {
            openedProjectId = projectId
        }
    }

    private func openAttentionOverdue() {
        if let id = overview?.queues?.tasksOverdue?.first?.id, !id.isEmpty {
            openedTaskId = id
        } else {
            router.openOverdueTasks()
        }
    }

    private var incompleteGetStarted: [(title: String, action: () -> Void)] {
        guard let gs = activationStatus?.getStarted else { return [] }
        var rows: [(String, () -> Void)] = []
        if gs.createProject != true {
            rows.append((NSLocalizedString("mgr_v43_step_create_project", comment: ""), { router.selectedTab = .projects }))
        }
        if gs.inviteTeam != true {
            rows.append((NSLocalizedString("mgr_v43_step_invite", comment: ""), { router.selectedTab = .more }))
        }
        if gs.addTask != true {
            rows.append((NSLocalizedString("mgr_v43_step_add_task", comment: ""), { router.selectedTab = .tasks }))
        }
        if gs.uploadReport != true {
            rows.append((NSLocalizedString("mgr_v43_step_upload_report", comment: ""), { router.openReportsReview() }))
        }
        if gs.viewAi != true {
            rows.append((NSLocalizedString("mgr_v43_step_view_ai", comment: ""), { router.selectedTab = .ai }))
        }
        return rows
    }

    private var getStartedSection: some View {
        let rows = incompleteGetStarted
        return Group {
            if !rows.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text(NSLocalizedString("mgr_v43_get_started", comment: ""))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                    ForEach(Array(rows.prefix(4).enumerated()), id: \.offset) { _, row in
                        Button(action: row.action) {
                            HStack {
                                Text(row.title)
                                    .foregroundStyle(ManagerV43.textPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(ManagerV43.textSecondary)
                            }
                            .padding(12)
                            .background(ManagerV43.card)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, ManagerV43.screenX)
            }
        }
    }

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(NSLocalizedString("mgr_v43_today_on_sites", comment: ""))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                Spacer()
                Button(NSLocalizedString("mgr_v43_all_tasks", comment: "")) { router.selectedTab = .tasks }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ManagerV43.dataBlue)
            }
            .padding(.horizontal, ManagerV43.screenX)
            if todayTasks.isEmpty {
                Text(NSLocalizedString("mgr_no_tasks_subtitle", comment: ""))
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
                    .padding(.horizontal, ManagerV43.screenX)
            } else {
                ForEach(todayTasks.prefix(4), id: \.id) { task in
                    NavigationLink(destination: TaskDetailManagerView(taskId: task.id)) {
                        TaskRowView(task: task)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, ManagerV43.screenX)
                }
            }
        }
    }

    private var aiSummaryCard: some View {
        let summary = guideSummary?.isEmpty == false ? guideSummary! : NSLocalizedString("mgr_v43_ai_fallback", comment: "")
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                ManagerAIBadge(size: 32)
                Text(NSLocalizedString("mgr_v43_ai_summary", comment: ""))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(ManagerV43.textPrimary)
                Spacer()
                if let guideConfidence {
                    Text("\(guideConfidence)%")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ManagerV43.aiViolet)
                }
            }
            Text(summary)
                .font(.system(size: 14))
                .foregroundStyle(ManagerV43.textSecondary)
            Button {
                router.selectedTab = .ai
            } label: {
                HStack {
                    Text(NSLocalizedString("mgr_v43_open_justification", comment: ""))
                    Image(systemName: "chevron.right")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(minHeight: 40)
                .background(ManagerV43.aiViolet.opacity(0.35))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(
            LinearGradient(colors: [ManagerV43.aiViolet.opacity(0.22), ManagerV43.card], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(ManagerV43.aiViolet.opacity(0.45), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, ManagerV43.screenX)
    }

    private func load() {
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        if errorMessage != nil { return }
        if overview == nil || projects.isEmpty {
            load()
        }
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 },
            previewFallback: {
                overview = ManagerDemoCatalog.overview
                projects = ManagerDemoCatalog.projects
                todayTasks = ManagerDemoCatalog.tasks
                lastSync = Date()
                router.tasksBadge = overview?.kpis?.tasksOverdue ?? 0
                router.notificationsBadge = ManagerDemoCatalog.notifications.filter { $0.readAt == nil }.count
                reviewReportsCount = ManagerDemoCatalog.reports.filter { ManagerV43Formatters.reportQueueBucket(from: $0.status) == "review" }.count
                workloadItems = ManagerDemoCatalog.workload
            }
        ) {
            overview = try await ManagerAPI.opsOverview()
            projects = (try? await ManagerAPI.projects()) ?? []
            let day = ManagerV43Formatters.dayISO()
            todayTasks = (try? await ManagerAPI.tasks(from: day, to: day, limit: 20)) ?? []
            if let featuredId = projects.first?.id {
                featuredEstimate = try? await ManagerAPI.projectEstimate(projectId: featuredId)
            }
            ManagerCacheStore.save(projects.map(\.id), key: "mgr.cache.projectIds")
            lastSync = Date()
            router.tasksBadge = overview?.kpis?.tasksOverdue
                ?? todayTasks.filter { ManagerV43Formatters.isTaskOverdue(status: $0.status, dueDate: $0.dueDate) }.count
            if let reports = try? await ManagerAPI.reports(limit: 100) {
                reviewReportsCount = reports.filter { ManagerV43Formatters.reportQueueBucket(from: $0.status) == "review" }.count
                ManagerCacheStore.save(reports, key: "mgr.v43.reports")
            }
            if let unread = try? await ManagerAPI.unreadNotificationCount() {
                router.notificationsBadge = unread
            } else if let notes = try? await ManagerAPI.notifications(limit: 50, offset: 0) {
                router.notificationsBadge = notes.items.filter { $0.readAt == nil }.count
            }
            workspaceName = await ManagerAPI.resolvedWorkspaceName()
            workloadItems = ((try? await ManagerAPI.workload())?.items) ?? []
            let activation = try? await ManagerAPI.activationStatus()
            activationStatus = activation
            if aiAssistantOn, let getStarted = activation?.getStarted {
                helpHints = (try? await ManagerAPI.helpHints(
                    locale: supportedHelpLocale(),
                    role: "manager",
                    getStarted: getStarted
                )) ?? []
            } else {
                helpHints = []
            }
            if aiAssistantOn {
                let assistant = try? await ManagerAPI.helpAssistant(
                    query: "",
                    locale: supportedHelpLocale(),
                    role: "manager",
                    pathname: "/dashboard",
                    activation: activation
                )
                await ManagerAPI.helpAssistantEvent(
                    type: "open",
                    locale: supportedHelpLocale(),
                    role: "manager",
                    pathname: "/dashboard"
                )
                guideSummary = assistant?.summary
                guideConfidence = assistant?.confidence
                guideRiskSignals = assistant?.riskSignals ?? []
            } else {
                guideSummary = nil
                guideConfidence = nil
                guideRiskSignals = []
            }
        }
    }

    private func supportedHelpLocale() -> String {
        let preferred = Locale.preferredLanguages.first ?? "en"
        let language = String(preferred.prefix(2)).lowercased()
        return ["ru", "es", "it"].contains(language) ? language : "en"
    }
}
