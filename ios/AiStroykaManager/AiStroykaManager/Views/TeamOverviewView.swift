//
//  TeamOverviewView.swift
//  AiStroyka Manager
//

import SwiftUI
import UIKit
import Shared

struct TeamOverviewView: View {
    @EnvironmentObject var router: ManagerTabRouter
    @StateObject private var network = NetworkMonitor.shared
    @State private var workers: [WorkerRowDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var selectedProjectId: String?
    @State private var segment = "members"
    @State private var query = ""
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var lastSync: Date?
    @State private var showInvite = false
    @State private var members: [TenantMemberDTO] = []
    @State private var invitations: [TenantInvitationDTO] = []

    private let cacheKey = "mgr.v43.workers"

    var body: some View {
        Group {
            if isLoading && workers.isEmpty && errorMessage == nil {
                ScrollView {
                    VStack(spacing: 12) {
                        ManagerSkeletonBlock(height: 72)
                        ManagerSkeletonBlock(height: 120)
                    }
                    .padding(ManagerV43.screenX)
                }
            } else if let err = errorMessage, workers.isEmpty {
                if ManagerV43Formatters.isPermissionDenied(err) {
                    EmptyStateView(title: NSLocalizedString("mgr_v43_permission_denied", comment: ""), subtitle: err)
                } else {
                    ErrorStateView(message: err, retry: { load() })
                }
            } else {
                content
            }
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .overlay(alignment: .topLeading) {
            Text("team-overview")
                .font(.system(size: 1))
                .foregroundStyle(.clear)
                .accessibilityIdentifier("pilot_manager_team")
                .accessibilityLabel("team-overview")
        }
        .navigationTitle(NSLocalizedString("mgr_tab_team", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showInvite = true } label: {
                    Image(systemName: "person.badge.plus")
                }
                .accessibilityLabel(NSLocalizedString("mgr_v43_invite", comment: ""))
            }
        }
        .refreshable { await loadAsync() }
        .onAppear {
            if workers.isEmpty, let cached = ManagerCacheStore.load([WorkerRowDTO].self, key: cacheKey) {
                workers = cached
                lastSync = ManagerCacheStore.lastSync(key: cacheKey)
            }
            loadIfNeeded()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.teamChanged)) { _ in
            load()
        }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            load()
        }
        .sheet(isPresented: $showInvite) {
            InviteTeammateSheet(onDismiss: { showInvite = false })
        }
    }

    private var filtered: [WorkerRowDTO] {
        workers.filter { worker in
            guard !query.isEmpty else { return true }
            if worker.userId.localizedCaseInsensitiveContains(query) { return true }
            let email = members.first(where: { $0.userId == worker.userId })?.email ?? ""
            return email.localizedCaseInsensitiveContains(query)
        }
    }

    private var filteredMembers: [TenantMemberDTO] {
        members.filter { member in
            guard !query.isEmpty else { return true }
            if member.userId.localizedCaseInsensitiveContains(query) { return true }
            return (member.email ?? "").localizedCaseInsensitiveContains(query)
        }
    }

    private var presenceCounts: (onSite: Int, office: Int, offline: Int) {
        var onSite = 0, office = 0, offline = 0
        for worker in workers {
            switch ManagerV43Formatters.workerPresence(
                openShift: worker.anomalies?.openShift,
                noActivity: worker.anomalies?.noActivity,
                lastStartedAt: worker.lastStartedAt,
                lastEndedAt: worker.lastEndedAt
            ) {
            case "on_site": onSite += 1
            case "office": office += 1
            default: offline += 1
            }
        }
        return (onSite, office, offline)
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if !network.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                }

                Menu {
                    Button(NSLocalizedString("mgr_v43_all_projects", comment: "")) {
                        selectedProjectId = nil
                        load()
                    }
                    ForEach(projects, id: \.id) { project in
                        Button(project.name ?? project.id) {
                            selectedProjectId = project.id
                            load()
                        }
                    }
                } label: {
                    HStack {
                        ManagerSiteThumb(size: CGSize(width: 36, height: 36), corner: 8)
                        Text(projects.first(where: { $0.id == selectedProjectId })?.name ?? NSLocalizedString("mgr_v43_all_projects", comment: ""))
                            .foregroundStyle(ManagerV43.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.down").foregroundStyle(ManagerV43.textSecondary)
                    }
                    .padding(10)
                    .background(ManagerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                HStack {
                    segmentButton("members", String(format: NSLocalizedString("mgr_v43_participants_fmt", comment: ""), workers.count))
                    segmentButton("contractors", NSLocalizedString("mgr_v43_contractors", comment: ""))
                    segmentButton("roles", NSLocalizedString("mgr_v43_roles", comment: ""))
                }

                ManagerV43Card {
                    HStack {
                        presenceCol(NSLocalizedString("mgr_v43_on_site", comment: ""), presenceCounts.onSite, ManagerV43.success)
                        presenceCol(NSLocalizedString("mgr_v43_in_office", comment: ""), presenceCounts.office, ManagerV43.dataBlue)
                        presenceCol(NSLocalizedString("mgr_v43_offline_status", comment: ""), presenceCounts.offline, ManagerV43.textSecondary)
                    }
                    HStack {
                        Image(systemName: workers.isEmpty ? "exclamationmark.triangle" : "checkmark.circle.fill")
                            .foregroundStyle(workers.isEmpty ? ManagerV43.warning : ManagerV43.success)
                        Text(workers.isEmpty ? NSLocalizedString("mgr_v43_roles_gap", comment: "") : NSLocalizedString("mgr_v43_roles_assigned", comment: ""))
                            .font(.caption)
                            .foregroundStyle(ManagerV43.textSecondary)
                    }
                }

                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(ManagerV43.textSecondary)
                    TextField(NSLocalizedString("mgr_v43_team_search", comment: ""), text: $query)
                        .foregroundStyle(ManagerV43.textPrimary)
                }
                .padding(.horizontal, 12)
                .frame(minHeight: ManagerV43.touch)
                .background(ManagerV43.card)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                if segment == "members", !invitations.isEmpty {
                    Text(NSLocalizedString("mgr_v43_pending_invites", comment: ""))
                        .font(.headline)
                        .foregroundStyle(ManagerV43.textPrimary)
                    ForEach(invitations) { invite in
                        ManagerV43Card {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(invite.email ?? invite.id)
                                        .foregroundStyle(ManagerV43.textPrimary)
                                    Text(invite.role ?? "member")
                                        .font(.caption)
                                        .foregroundStyle(ManagerV43.textSecondary)
                                }
                                Spacer()
                                ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_invite_sent", comment: ""), kind: .warning)
                            }
                        }
                    }
                }
                if !filteredMembers.isEmpty && segment == "roles" {
                    ForEach(filteredMembers) { member in
                        ManagerV43Card {
                            HStack {
                                Text(member.email.flatMap { $0.isEmpty ? nil : $0 } ?? ManagerV43Formatters.shortIdentifier(member.userId))
                                    .foregroundStyle(ManagerV43.textPrimary)
                                Spacer()
                                ManagerV43StatusPill(
                                    text: member.role ?? "member",
                                    kind: member.isOwner == true ? .success : .warning
                                )
                                WorkerContactButton(email: member.email, userId: member.userId)
                            }
                        }
                    }
                }
                if segment == "contractors" {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_v43_contractors", comment: ""),
                        subtitle: NSLocalizedString("mgr_v43_no_contractors", comment: "")
                    )
                    .frame(minHeight: 160)
                } else if segment == "roles" {
                    rolesBlock
                } else if filtered.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_workers_title", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_workers_subtitle", comment: "")
                    )
                    .frame(minHeight: 160)
                } else {
                    ForEach(filtered, id: \.userId) { worker in
                        let member = members.first(where: { $0.userId == worker.userId })
                        WorkerCanonRow(
                            worker: worker,
                            role: member?.role,
                            email: member?.email
                        )
                    }
                }

                if ManagerV43Preview.isEnabled {
                    ManagerV43Card(borderColor: ManagerV43.warning.opacity(0.7)) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(ManagerV43.warning)
                            VStack(alignment: .leading) {
                                Text(NSLocalizedString("mgr_v43_needs_owner", comment: "")).foregroundStyle(ManagerV43.textPrimary)
                                Text(NSLocalizedString("mgr_v43_risk_rebar_title", comment: ""))
                                    .font(.caption)
                                    .foregroundStyle(ManagerV43.textSecondary)
                            }
                            Spacer()
                            Button(NSLocalizedString("mgr_v43_assign", comment: "")) {
                                router.openAIRisk("demo-rebar")
                            }
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(ManagerV43.yellowInk)
                            .padding(.horizontal, 10)
                            .frame(minHeight: 36)
                            .background(ManagerV43.yellow)
                            .clipShape(Capsule())
                        }
                    }
                }

                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_invite", comment: ""),
                    systemImage: "person.badge.plus"
                ) { showInvite = true }
            }
            .padding(.horizontal, ManagerV43.screenX)
            .padding(.bottom, 24)
        }
    }

    private var rolesBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(["mgr_v43_role_manager", "mgr_v43_role_engineer", "mgr_v43_field_worker"], id: \.self) { key in
                ManagerV43Card {
                    HStack {
                        Text(NSLocalizedString(key, comment: "")).foregroundStyle(ManagerV43.textPrimary)
                        Spacer()
                        ManagerV43StatusPill(
                            text: workers.isEmpty ? NSLocalizedString("mgr_v43_needs_owner", comment: "") : NSLocalizedString("mgr_v43_roles_assigned", comment: ""),
                            kind: workers.isEmpty ? .warning : .success
                        )
                    }
                }
            }
        }
    }

    private func segmentButton(_ id: String, _ title: String) -> some View {
        Button {
            withAnimation(.easeInOut(duration: ManagerV43.motion)) { segment = id }
        } label: {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(segment == id ? ManagerV43.yellow : ManagerV43.textSecondary)
                .frame(maxWidth: .infinity)
                .padding(.bottom, 8)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(segment == id ? ManagerV43.yellow : Color.clear).frame(height: 2)
                }
        }
        .buttonStyle(.plain)
        .frame(minHeight: ManagerV43.touch)
    }

    private func presenceCol(_ title: String, _ count: Int, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 8, height: 8)
                Text("\(count)").font(.headline).foregroundStyle(ManagerV43.textPrimary)
            }
            Text(title).font(.caption2).foregroundStyle(ManagerV43.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        if errorMessage != nil { return }
        if workers.isEmpty || projects.isEmpty {
            load()
        }
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 },
            previewFallback: {
                workers = ManagerDemoCatalog.workers
                projects = ManagerDemoCatalog.projects
                members = ManagerDemoCatalog.members
                lastSync = Date()
            }
        ) {
            let allWorkers = try await ManagerAPI.workers(limit: 200)
            projects = (try? await ManagerAPI.projects()) ?? []
            members = (try? await ManagerAPI.tenantMembers()) ?? []
            invitations = (try? await ManagerAPI.tenantInvitations()) ?? []
            if let pid = selectedProjectId {
                let scoped = (try? await ManagerAPI.projectWorkers(projectId: pid, limit: 200)) ?? []
                let ids = Set(scoped.map(\.userId))
                workers = allWorkers.filter { ids.contains($0.userId) }
            } else {
                workers = allWorkers
            }
            ManagerCacheStore.save(workers, key: cacheKey)
            lastSync = Date()
        }
    }
}

struct WorkerCanonRow: View {
    let worker: WorkerRowDTO
    var role: String? = nil
    var email: String? = nil

    var body: some View {
        ManagerV43Card {
            HStack(spacing: 12) {
                NavigationLink(destination: WorkerDetailView(worker: worker, email: email)) {
                    HStack(spacing: 12) {
                        Circle()
                            .fill(ManagerV43.cardStrong)
                            .frame(width: 40, height: 40)
                            .overlay(Text(initials).font(.caption.weight(.bold)).foregroundStyle(ManagerV43.textPrimary))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(ManagerV43Formatters.shortIdentifier(worker.userId))
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(ManagerV43.textPrimary)
                            Text(role ?? NSLocalizedString("mgr_v43_field_worker", comment: ""))
                                .font(.caption)
                                .foregroundStyle(ManagerV43.textSecondary)
                        }
                        Spacer(minLength: 8)
                        ManagerV43StatusPill(text: presenceLabel, kind: presenceKind)
                    }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("pilot_manager_worker_\(worker.userId)")
                WorkerContactButton(email: email, userId: worker.userId)
            }
        }
    }

    private var initials: String {
        String(worker.userId.prefix(2)).uppercased()
    }

    private var presence: String {
        ManagerV43Formatters.workerPresence(
            openShift: worker.anomalies?.openShift,
            noActivity: worker.anomalies?.noActivity,
            lastStartedAt: worker.lastStartedAt,
            lastEndedAt: worker.lastEndedAt
        )
    }

    private var presenceLabel: String {
        switch presence {
        case "on_site": return NSLocalizedString("mgr_v43_on_site", comment: "")
        case "office": return NSLocalizedString("mgr_v43_in_office", comment: "")
        default: return NSLocalizedString("mgr_v43_offline_status", comment: "")
        }
    }

    private var presenceKind: ManagerV43StatusPill.Kind {
        switch presence {
        case "on_site": return .success
        case "office": return .info
        default: return .neutral
        }
    }
}

struct WorkerRowView: View {
    let worker: WorkerRowDTO
    var body: some View { WorkerCanonRow(worker: worker) }
}

struct WorkerDetailView: View {
    @EnvironmentObject var router: ManagerTabRouter
    let worker: WorkerRowDTO
    var email: String? = nil
    @State private var summary: WorkerSummaryDTO?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if let summary {
                    HStack(spacing: 8) {
                        ManagerV43StatusPill(
                            text: String(format: NSLocalizedString("mgr_v43_worker_assigned_fmt", comment: ""), summary.tasksAssigned ?? 0),
                            kind: .info
                        )
                        ManagerV43StatusPill(
                            text: String(format: NSLocalizedString("mgr_v43_worker_overdue_fmt", comment: ""), summary.tasksOverdue ?? 0),
                            kind: (summary.tasksOverdue ?? 0) > 0 ? .danger : .neutral
                        )
                        ManagerV43StatusPill(
                            text: String(format: NSLocalizedString("mgr_v43_worker_review_fmt", comment: ""), summary.reportsPendingReview ?? 0),
                            kind: (summary.reportsPendingReview ?? 0) > 0 ? .warning : .neutral
                        )
                    }
                }
                ManagerV43Card {
                    LabeledContent(NSLocalizedString("mgr_user_id", comment: ""), value: worker.userId)
                    if let email, !email.isEmpty {
                        LabeledContent(NSLocalizedString("mgr_v43_contact", comment: ""), value: email)
                    }
                    if let day = worker.lastDayDate {
                        LabeledContent(NSLocalizedString("mgr_day", comment: ""), value: day)
                    }
                    if let s = worker.lastStartedAt { LabeledContent(NSLocalizedString("mgr_started", comment: ""), value: formatDate(s)) }
                    if let e = worker.lastEndedAt { LabeledContent(NSLocalizedString("mgr_ended", comment: ""), value: formatDate(e)) }
                    if let r = worker.lastReportSubmittedAt { LabeledContent(NSLocalizedString("mgr_last_report", comment: ""), value: formatDate(r)) }
                }
                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_contact", comment: ""),
                    systemImage: "phone"
                ) {
                    ManagerTeamContact.open(email: email, fallback: worker.userId)
                }
                .accessibilityIdentifier("pilot_manager_worker_contact_detail")
                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_assign", comment: ""),
                    systemImage: "person.badge.plus",
                    fill: ManagerV43.dataBlue,
                    ink: .white
                ) {
                    router.openNewTask(assignedTo: worker.userId)
                }
                .accessibilityIdentifier("pilot_manager_worker_assign")
                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_all_tasks", comment: ""),
                    systemImage: "checklist"
                ) {
                    if (summary?.tasksOverdue ?? 0) > 0 {
                        router.openOverdueTasks()
                    } else {
                        router.selectedTab = .tasks
                    }
                }
                if (summary?.reportsPendingReview ?? 0) > 0 {
                    ManagerV43PrimaryButton(
                        title: NSLocalizedString("mgr_tab_reports", comment: ""),
                        systemImage: "doc.text",
                        fill: ManagerV43.dataBlue,
                        ink: .white
                    ) {
                        router.openReportsReview()
                    }
                }
                if let a = worker.anomalies {
                    ManagerV43Card {
                        if a.openShift == true { Label(NSLocalizedString("mgr_open_shift", comment: ""), systemImage: "clock.badge.exclamation") }
                        if a.overtime == true { Label(NSLocalizedString("mgr_overtime", comment: ""), systemImage: "exclamationmark.triangle") }
                        if a.noActivity == true { Label(NSLocalizedString("mgr_no_recent_activity", comment: ""), systemImage: "person.slash") }
                    }
                }
            }
            .padding(ManagerV43.screenX)
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_worker", comment: ""))
        .task { await loadSummary() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
            Task { await loadSummary() }
        }
    }

    private func loadSummary() async {
        summary = try? await ManagerAPI.workerSummary(userId: worker.userId)
    }

    private func formatDate(_ s: String) -> String {
        if let d = ManagerV43Formatters.parseISODate(s) {
            return d.formatted(date: .abbreviated, time: .shortened)
        }
        return s
    }
}

private struct WorkerContactButton: View {
    let email: String?
    let userId: String

    var body: some View {
        Button {
            ManagerTeamContact.open(email: email, fallback: userId)
        } label: {
            Image(systemName: "phone")
                .foregroundStyle(ManagerV43.dataBlue)
                .frame(width: ManagerV43.touch, height: ManagerV43.touch)
        }
        .buttonStyle(.borderless)
        .accessibilityLabel(
            NSLocalizedString(
                (email?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false) ? "mgr_v43_contact" : "mgr_v43_copy_id",
                comment: ""
            )
        )
        .accessibilityIdentifier("pilot_manager_worker_contact")
    }
}

enum ManagerTeamContact {
    static func open(email: String?, fallback: String) {
        let trimmed = email?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if ManagerUITestLaunchHooks.isEnabled {
            UIPasteboard.general.string = trimmed.isEmpty ? fallback : trimmed
            return
        }
        if !trimmed.isEmpty {
            var allowed = CharacterSet.urlQueryAllowed
            allowed.remove(charactersIn: "&?")
            if let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: allowed),
               let url = URL(string: "mailto:\(encoded)") {
                UIApplication.shared.open(url)
                return
            }
        }
        UIPasteboard.general.string = fallback
    }
}

struct InviteTeammateSheet: View {
    var onDismiss: () -> Void
    @State private var email = ""
    @State private var role = "member"
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var didSend = false

    private let roles = ["member", "admin", "viewer"]

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                TextField(NSLocalizedString("mgr_v43_invite_email", comment: ""), text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
                    .padding(12)
                    .frame(minHeight: ManagerV43.touch)
                    .background(ManagerV43.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .foregroundStyle(ManagerV43.textPrimary)
                    .accessibilityIdentifier("pilot_manager_invite_email")
                Picker(NSLocalizedString("mgr_v43_invite_role", comment: ""), selection: $role) {
                    ForEach(roles, id: \.self) { value in
                        Text(NSLocalizedString("mgr_v43_role_\(value)", comment: "")).tag(value)
                    }
                }
                .pickerStyle(.segmented)
                .accessibilityIdentifier("pilot_manager_invite_role")
                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(ManagerV43.danger)
                }
                if didSend {
                    Text(NSLocalizedString("mgr_v43_invite_sent", comment: ""))
                        .font(.caption)
                        .foregroundStyle(ManagerV43.success)
                }
                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_invite", comment: ""),
                    systemImage: "paperplane.fill",
                    enabled: isValidEmail && !isSaving,
                    loading: isSaving
                ) {
                    Task { await send() }
                }
                .accessibilityIdentifier("pilot_manager_invite_submit")
                Spacer()
            }
            .padding(ManagerV43.screenX)
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("mgr_v43_invite_title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("mgr_cancel", comment: ""), action: onDismiss)
                        .accessibilityIdentifier("pilot_manager_invite_cancel")
                }
            }
        }
    }

    private var isValidEmail: Bool {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.contains("@") && trimmed.contains(".") && trimmed.count >= 5
    }

    private func send() async {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard isValidEmail else {
            errorMessage = NSLocalizedString("mgr_v43_invite_invalid_email", comment: "")
            return
        }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        if ManagerV43Preview.isEnabled {
            didSend = true
            return
        }
        do {
            try await ManagerAPI.inviteTeammate(email: trimmed, role: role)
            didSend = true
            ManagerLiveSync.post(ManagerLiveSync.teamChanged)
        } catch {
            let api = error as? APIError
            if api?.isForbidden == true {
                errorMessage = NSLocalizedString("mgr_v43_permission_denied", comment: "")
            } else if api?.isConflict == true {
                errorMessage = NSLocalizedString("mgr_v43_invite_exists", comment: "")
            } else {
                errorMessage = api?.userFacingMessage ?? error.localizedDescription
            }
        }
    }
}
