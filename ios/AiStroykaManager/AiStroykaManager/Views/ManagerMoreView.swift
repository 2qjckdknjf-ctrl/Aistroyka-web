//
//  ManagerMoreView.swift
//  AiStroyka Manager
//

import SwiftUI
import UIKit
import Shared

enum ManagerMoreDestination: Hashable {
    case settings
    case notifications
    case reports
    case documents
    case team
    case analytics
    case decisions
    case task(id: String)
    case report(id: String)
    case project(id: String)
    case issues(projectId: String, issueId: String?)
}

struct ManagerMoreView: View {
    @EnvironmentObject var sessionState: ManagerSessionState
    @EnvironmentObject var router: ManagerTabRouter
    @State private var path: [ManagerMoreDestination] = []
    @AppStorage("mgr.v43.aiAssistantOn") private var aiAssistantOn = true
    @StateObject private var network = NetworkMonitor.shared
    @State private var meRole: String?
    @State private var workspaceName: String?
    @State private var projectCount = 0
    @State private var reportsBadge: Int?
    @State private var lastSync: Date?
    @State private var meEmail: String?
    @State private var documentsProjectId: String?

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(NSLocalizedString("mgr_tab_more", comment: ""))
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                        .padding(.horizontal, ManagerV43.screenX)
                        .padding(.top, 8)

                    profileCard
                    companyCard

                    section(NSLocalizedString("mgr_v43_work", comment: ""), [
                        (.reports, "doc.text", NSLocalizedString("mgr_tab_reports", comment: ""), reportsBadge.map(String.init)),
                        (.documents, "folder", NSLocalizedString("mgr_v43_documents", comment: ""), nil),
                        (.team, "person.3", NSLocalizedString("mgr_tab_team", comment: ""), nil),
                        (.analytics, "chart.bar", NSLocalizedString("mgr_v43_analytics", comment: ""), nil),
                        (.decisions, "lightbulb", NSLocalizedString("mgr_v43_decisions", comment: ""), nil),
                    ])

                    settingsSection

                    Toggle(isOn: $aiAssistantOn) {
                        HStack {
                            ManagerAIBadge(size: 28)
                            VStack(alignment: .leading) {
                                Text(NSLocalizedString("mgr_v43_ai_assistant", comment: ""))
                                    .foregroundStyle(ManagerV43.textPrimary)
                                Text(NSLocalizedString("mgr_v43_ai_assistant_sub", comment: ""))
                                    .font(.caption)
                                    .foregroundStyle(ManagerV43.textSecondary)
                            }
                        }
                    }
                    .tint(ManagerV43.aiViolet)
                    .padding(12)
                    .background(ManagerV43.card)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(ManagerV43.aiViolet.opacity(0.45), lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .padding(.horizontal, ManagerV43.screenX)
                    .onChange(of: aiAssistantOn) { _ in
                        ManagerLiveSync.post(ManagerLiveSync.aiAssistantChanged)
                    }

                    NavigationLink {
                        ManagerHowItWorksView()
                    } label: {
                        moreRow("questionmark.circle", NSLocalizedString("mgr_v43_help_support", comment: ""), nil, NSLocalizedString("mgr_more_how_it_works", comment: ""))
                    }
                    .padding(.horizontal, ManagerV43.screenX)

                    Text(String(format: NSLocalizedString("mgr_v43_about_fmt", comment: ""), Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "4.3.0"))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                        .padding(.horizontal, ManagerV43.screenX)

                    Button(NSLocalizedString("mgr_sign_out", comment: ""), role: .destructive) {
                        Task { await sessionState.signOut() }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .padding(.bottom, 24)
            }
            .accessibilityIdentifier("pilot_manager_more_root")
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: ManagerMoreDestination.self) { dest in
                switch dest {
                case .settings:
                    ManagerSettingsView()
                case .notifications:
                    NotificationsView(onOpenTarget: { targetType, targetId, projectId in
                        let t = targetType.lowercased()
                        if t == "task" { path.append(.task(id: targetId)) }
                        else if t == "report" { path.append(.report(id: targetId)) }
                        else if t == "issue", let projectId {
                            path.append(.issues(projectId: projectId, issueId: targetId))
                        }
                        else if t == "project" { path.append(.project(id: targetId)) }
                        else if t == "document" {
                            documentsProjectId = projectId ?? targetId
                            path.append(.documents)
                        }
                    })
                case .reports:
                    ReportsInboxView()
                        .accessibilityIdentifier("pilot_manager_tab_reports")
                case .documents:
                    DocumentsHubView(initialProjectId: documentsProjectId)
                case .team:
                    TeamOverviewView()
                case .analytics:
                    ProjectAnalyticsView()
                case .decisions:
                    ManagerDecisionsView()
                case .task(let id):
                    TaskDetailManagerView(taskId: id)
                case .report(let id):
                    ReportDetailReviewView(reportId: id)
                case .project(let id):
                    ProjectDetailView(projectId: id, projectName: nil)
                case .issues(let projectId, let issueId):
                    ProjectIssuesForProjectView(projectId: projectId, focusIssueId: issueId)
                }
            }
            .task { await loadMeta() }
            .onAppear { consumeRouterDeepLinks() }
            .onChange(of: router.pendingReportId) { _ in consumeRouterDeepLinks() }
            .onChange(of: router.pendingDocumentsProjectId) { _ in consumeRouterDeepLinks() }
            .onChange(of: router.pendingIssueId) { _ in consumeRouterDeepLinks() }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.reportsChanged)) { _ in
                Task { await loadMeta() }
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.projectsChanged)) { _ in
                Task { await loadMeta() }
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.notificationsChanged)) { _ in
                Task { await loadMeta() }
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.workspaceChanged)) { _ in
                Task { await loadMeta() }
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
                Task { await loadMeta() }
            }
        }
    }

    private var profileCard: some View {
        NavigationLink(value: ManagerMoreDestination.settings) {
            HStack(spacing: 12) {
                Circle().fill(ManagerV43.cardStrong).frame(width: 52, height: 52)
                    .overlay(Image(systemName: "person.fill").foregroundStyle(ManagerV43.textSecondary))
                VStack(alignment: .leading, spacing: 4) {
                    Text(profileTitle)
                        .font(.headline)
                        .foregroundStyle(ManagerV43.textPrimary)
                    Text(profileSubtitle)
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
            }
            .padding(16)
            .background(ManagerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .padding(.horizontal, ManagerV43.screenX)
    }

    private var companyCard: some View {
        HStack {
            Image(systemName: "building.2.fill").foregroundStyle(ManagerV43.dataBlue)
            VStack(alignment: .leading) {
                Text(workspaceTitle)
                    .foregroundStyle(ManagerV43.textPrimary)
                Text(String(format: NSLocalizedString("mgr_v43_plan_fmt", comment: ""), projectCount))
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
                Text(network.isConnected ? NSLocalizedString("mgr_v43_online", comment: "") : NSLocalizedString("mgr_v43_offline", comment: ""))
                    .font(.caption)
                    .foregroundStyle(network.isConnected ? ManagerV43.success : ManagerV43.warning)
            }
            Spacer()
            Button(action: openCabinetDashboard) {
                Text(NSLocalizedString("mgr_v43_manage_plan", comment: ""))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ManagerV43.yellow)
                    .padding(.horizontal, 10)
                    .frame(minHeight: 36)
                    .overlay(Capsule().stroke(ManagerV43.yellow, lineWidth: 1))
            }
        }
        .padding(16)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, ManagerV43.screenX)
    }

    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("mgr_settings", comment: "").uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(ManagerV43.textSecondary)
                .padding(.horizontal, ManagerV43.screenX)
            VStack(spacing: 0) {
                NavigationLink(value: ManagerMoreDestination.notifications) {
                    moreRow("bell", NSLocalizedString("mgr_notifications", comment: ""), nil, NSLocalizedString("mgr_v43_notifications_sub", comment: ""))
                }
                .accessibilityIdentifier("pilot_manager_more_notifications")
                Button {
                    Task { await loadMeta() }
                } label: {
                    moreRow(
                        "icloud.and.arrow.down",
                        NSLocalizedString("mgr_v43_offline_data", comment: ""),
                        nil,
                        lastSync.map { String(format: NSLocalizedString("mgr_v43_last_sync_fmt", comment: ""), ManagerV43Formatters.relativeTime($0)) }
                    )
                }
                .buttonStyle(.plain)
                NavigationLink(value: ManagerMoreDestination.settings) {
                    moreRow("lock.shield", NSLocalizedString("mgr_v43_security", comment: ""), nil, nil)
                }
                .accessibilityIdentifier("pilot_manager_more_settings")
                Button {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    HStack {
                        Image(systemName: "globe").foregroundStyle(ManagerV43.dataBlue).frame(width: 24)
                        Text(NSLocalizedString("mgr_v43_language", comment: "")).foregroundStyle(ManagerV43.textPrimary)
                        Spacer()
                        Text(Locale.current.localizedString(forIdentifier: Locale.current.identifier) ?? Locale.current.identifier)
                            .foregroundStyle(ManagerV43.textSecondary)
                        Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
                    }
                    .padding(.horizontal, 14)
                    .frame(minHeight: ManagerV43.touch)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(NSLocalizedString("mgr_v43_language", comment: ""))
            }
            .background(ManagerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .padding(.horizontal, ManagerV43.screenX)
        }
    }

    private func section(_ title: String, _ rows: [(ManagerMoreDestination, String, String, String?)]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(ManagerV43.textSecondary)
                .padding(.horizontal, ManagerV43.screenX)
            VStack(spacing: 0) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    NavigationLink(value: row.0) {
                        moreRow(row.1, row.2, row.3, nil)
                    }
                    .accessibilityIdentifier(moreRowIdentifier(row.0))
                }
            }
            .background(ManagerV43.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .padding(.horizontal, ManagerV43.screenX)
        }
    }

    private func moreRowIdentifier(_ dest: ManagerMoreDestination) -> String {
        switch dest {
        case .reports: return "pilot_manager_tab_reports"
        case .documents: return "pilot_manager_more_documents"
        case .team: return "pilot_manager_more_team"
        case .analytics: return "pilot_manager_more_analytics"
        case .decisions: return "pilot_manager_more_decisions"
        case .notifications: return "pilot_manager_more_notifications"
        case .settings: return "pilot_manager_more_settings"
        case .task, .report, .project, .issues: return ""
        }
    }

    private func moreRow(_ icon: String, _ title: String, _ badge: String?, _ subtitle: String?) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(ManagerV43.dataBlue).frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).foregroundStyle(ManagerV43.textPrimary)
                if let subtitle {
                    Text(subtitle).font(.caption).foregroundStyle(ManagerV43.textSecondary)
                }
            }
            Spacer()
            if let badge {
                Text(badge)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(ManagerV43.dataBlue)
                    .clipShape(Capsule())
            }
            Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
        }
        .padding(.horizontal, 14)
        .frame(minHeight: ManagerV43.touch)
    }

    private func loadMeta() async {
        if let cachedIds = ManagerCacheStore.load([String].self, key: "mgr.cache.projectIds") {
            projectCount = cachedIds.count
        }
        if let session = await AuthService.shared.currentSession() {
            meEmail = session.user.email
        }
        if let reports = try? await ManagerAPI.reports(limit: 100) {
            reportsBadge = reports.filter { ManagerV43Formatters.reportQueueBucket(from: $0.status) == "review" }.count
            ManagerCacheStore.save(reports, key: "mgr.v43.reports")
            lastSync = Date()
        } else if ManagerV43Preview.showsCatalogWithoutAuth {
            reportsBadge = ManagerDemoCatalog.reports.filter { ManagerV43Formatters.reportQueueBucket(from: $0.status) == "review" }.count
            lastSync = Date()
        } else {
            lastSync = ManagerCacheStore.lastSync(key: "mgr.v43.reports")
        }
        if let projects = try? await ManagerAPI.projects() {
            projectCount = projects.count
        } else if ManagerV43Preview.showsCatalogWithoutAuth {
            projectCount = ManagerDemoCatalog.projects.count
        }
        if let me = try? await ManagerAPI.me() {
            meRole = me.data?.role
        }
        workspaceName = await ManagerAPI.resolvedWorkspaceName()
        if let session = await AuthService.shared.currentSession() {
            meEmail = session.user.email
        }
    }

    private var workspaceTitle: String {
        if ManagerV43Preview.isEnabled {
            return workspaceName ?? ManagerDemoCatalog.workspaceName
        }
        return workspaceName ?? NSLocalizedString("mgr_v43_workspace", comment: "")
    }

    private func consumeRouterDeepLinks() {
        if let id = router.pendingReportId, !id.isEmpty {
            router.pendingReportId = nil
            path.append(.report(id: id))
        }
        if let id = router.pendingDocumentsProjectId, !id.isEmpty {
            router.pendingDocumentsProjectId = nil
            documentsProjectId = id
            path.append(.documents)
        }
        if let issueId = router.pendingIssueId, !issueId.isEmpty,
           let projectId = router.pendingIssueProjectId, !projectId.isEmpty {
            router.pendingIssueId = nil
            router.pendingIssueProjectId = nil
            path.append(.issues(projectId: projectId, issueId: issueId))
        }
    }

    private func openCabinetDashboard() {
        let raw = Locale.current.language.languageCode?.identifier ?? "en"
        let locale = ["en", "ru", "es", "it"].contains(raw) ? raw : "en"
        let base = Config.baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if let url = URL(string: "\(base)/\(locale)/dashboard") {
            UIApplication.shared.open(url)
        }
    }

    private var profileTitle: String {
        if ManagerV43Preview.showsCatalogWithoutAuth {
            return NSLocalizedString("mgr_v43_profile_name", comment: "")
        }
        return sessionState.signedInEmail ?? meEmail ?? NSLocalizedString("mgr_v43_profile_name", comment: "")
    }

    private var profileSubtitle: String {
        if let meRole, !meRole.isEmpty {
            return meRole
        }
        return sessionState.isLoggedIn
            ? NSLocalizedString("mgr_signed_in", comment: "")
            : NSLocalizedString("mgr_not_signed_in", comment: "")
    }
}

struct ManagerDecisionsView: View {
    @EnvironmentObject var router: ManagerTabRouter
    @State private var events: [ManagerRiskAuditEvent] = []

    var body: some View {
        Group {
            if events.isEmpty {
                EmptyStateView(
                    title: NSLocalizedString("mgr_v43_decisions", comment: ""),
                    subtitle: NSLocalizedString("mgr_v43_no_decisions", comment: "")
                )
            } else {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(events) { event in
                            Button {
                                if !event.riskId.isEmpty {
                                    router.openAIRisk(event.riskId)
                                }
                            } label: {
                                ManagerV43Card {
                                    Text(NSLocalizedString(event.decision.labelKey, comment: ""))
                                        .foregroundStyle(ManagerV43.textPrimary)
                                    Text(event.comment)
                                        .font(.caption)
                                        .foregroundStyle(ManagerV43.textSecondary)
                                    Text(ManagerV43Formatters.riskDecisionAuditLine(
                                        actor: event.actor,
                                        decision: event.decision.rawValue,
                                        comment: event.comment,
                                        source: event.source,
                                        at: event.createdAt
                                    ))
                                    .font(.caption2)
                                    .foregroundStyle(ManagerV43.textSecondary)
                                }
                            }
                            .buttonStyle(.plain)
                            .disabled(event.riskId.isEmpty)
                        }
                    }
                    .padding(ManagerV43.screenX)
                }
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_v43_decisions", comment: ""))
        .task { await load() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.decisionsChanged)) { _ in
            Task { await load() }
        }
    }

    private func load() async {
        if let remote = try? await ManagerAPI.riskDecisions() {
            events = remote.map { row in
                ManagerRiskAuditEvent(
                    id: row.id,
                    riskId: row.jobId ?? "",
                    decision: ManagerRiskDecision(rawValue: row.decision ?? "") ?? .accept,
                    comment: row.comment ?? "",
                    actor: row.actor ?? "manager",
                    source: "server",
                    createdAt: ManagerV43Formatters.parseISODate(row.createdAt) ?? Date()
                )
            }
            return
        }
        events = ManagerRiskAuditStore.all()
    }
}
