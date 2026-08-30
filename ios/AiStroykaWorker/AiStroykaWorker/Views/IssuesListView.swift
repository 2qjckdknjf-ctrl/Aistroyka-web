//
//  IssuesListView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct IssuesListView: View {
    let project: ProjectDTO
    var initialReport: Bool = false
    var linkedTaskId: String? = nil
    @State private var issues: [WorkerIssueDTO] = []
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var filter: WorkerIssueFilter = .open
    @State private var category: WorkerIssueCategory = .all
    @State private var showCreate = false
    @State private var createTitle = ""
    @State private var createDetail = ""
    @State private var createImage: UIImage?
    @State private var showCreateCamera = false
    @State private var creating = false
    @State private var currentUserId: String?

    var body: some View {
        NavigationStack {
            Group {
                if loading && issues.isEmpty {
                    ScrollView { WorkerV43Skeleton(height: 180).padding(WorkerV43.screenX) }
                } else if let errorMessage, issues.isEmpty {
                    WorkerV43EmptyState(
                        title: WorkerV43Copy.userFacing(errorMessage),
                        detail: NSLocalizedString("wrk_v43_cached_if_any", comment: ""),
                        retry: load
                    )
                } else {
                    content
                }
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("wrk_v43_issues", comment: ""))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showCreate = true } label: { Image(systemName: "plus") }
                        .accessibilityIdentifier("pilot_worker_issue_create")
                }
            }
            .refreshable { load() }
            .onAppear {
                issues = WorkerV43API.cachedIssues(projectId: project.id)
                load()
                if initialReport { showCreate = true }
                Task { currentUserId = await AuthService.shared.currentSession()?.user.id }
            }
            .sheet(isPresented: $showCreate) { createSheet }
            .accessibilityIdentifier("pilot_worker_issues_list")
        }
    }

    private var filtered: [WorkerIssueDTO] {
        issues.filter { issue in
            let statusOk: Bool
            switch filter {
            case .open: statusOk = issue.status == "open" || issue.status == "in_review"
            case .mine: statusOk = issue.isMine(currentUserId: currentUserId)
            case .closed: statusOk = issue.status == "resolved" || issue.status == "closed"
            }
            guard statusOk else { return false }
            switch category {
            case .all: return true
            case .safety: return matches(issue, ["safety", "безоп", "огражд", "fence"])
            case .quality: return matches(issue, ["quality", "качеств", "фиксат", "spacer"])
            case .materials: return matches(issue, ["material", "материал", "арматур", "rebar"])
            }
        }
    }

    private func matches(_ issue: WorkerIssueDTO, _ keys: [String]) -> Bool {
        let haystack = (issue.title + " " + (issue.description ?? "")).lowercased()
        return keys.contains { haystack.contains($0) }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    ForEach(WorkerIssueFilter.allCases, id: \.self) { item in
                        WorkerV43Chip(title: label(item), selected: filter == item) { filter = item }
                    }
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(WorkerIssueCategory.allCases, id: \.self) { item in
                            WorkerV43Chip(
                                title: categoryLabel(item),
                                selected: category == item
                            ) { category = item }
                        }
                    }
                }
                Button { showCreate = true } label: {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                        VStack(alignment: .leading) {
                            Text(NSLocalizedString("wrk_v43_report_issue", comment: ""))
                                .font(.system(size: 16, weight: .semibold))
                            Text(NSLocalizedString("wrk_v43_report_issue_sub", comment: ""))
                                .font(.caption)
                        }
                        Spacer()
                        Image(systemName: "camera.fill")
                    }
                    .foregroundStyle(WorkerV43.textPrimary)
                    .padding(14)
                    .background(WorkerV43.danger.opacity(0.85))
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .buttonStyle(.plain)
                if filtered.isEmpty {
                    WorkerV43EmptyState(
                        title: NSLocalizedString("wrk_v43_issues_empty", comment: ""),
                        systemImage: "checkmark.shield"
                    )
                }
                ForEach(filtered) { issue in
                    NavigationLink {
                        IssueResolutionView(project: project, issue: issue)
                    } label: {
                        WorkerV43Card(borderColor: issue.status == "open" ? WorkerV43.danger.opacity(0.5) : WorkerV43.border) {
                            VStack(alignment: .leading, spacing: 6) {
                                WorkerV43StatusPill(
                                    text: WorkerV43Copy.issueStatus(issue.status),
                                    kind: issue.status == "open" ? .danger : (issue.status == "in_review" ? .success : .neutral)
                                )
                                Text(issue.title)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(WorkerV43.textPrimary)
                                if let description = issue.description {
                                    Text(description)
                                        .font(.caption)
                                        .foregroundStyle(WorkerV43.textSecondary)
                                        .lineLimit(2)
                                }
                                if issue.evidenceUrl != nil || issue.evidenceUploadSessionId != nil {
                                    Label(
                                        NSLocalizedString("wrk_v43_issue_evidence", comment: ""),
                                        systemImage: "photo"
                                    )
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(WorkerV43.cyan)
                                }
                            }
                        }
                    }
                    .accessibilityIdentifier("pilot_worker_issue_\(issue.id)")
                }
            }
            .padding(WorkerV43.screenX)
        }
    }

    private var createSheet: some View {
        NavigationStack {
            Form {
                TextField(NSLocalizedString("wrk_v43_issue_title", comment: ""), text: $createTitle)
                TextField(NSLocalizedString("wrk_v43_issue_detail", comment: ""), text: $createDetail, axis: .vertical)
                Section {
                    if let createImage {
                        Image(uiImage: createImage)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 160)
                            .clipped()
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    Button {
                        showCreateCamera = true
                    } label: {
                        Label(
                            NSLocalizedString("wrk_v43_issue_attach_photo", comment: ""),
                            systemImage: "camera.fill"
                        )
                    }
                    .accessibilityIdentifier("pilot_worker_issue_create_photo")
                }
                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(WorkerV43.danger)
                }
            }
            .scrollContentBackground(.hidden)
            .background(WorkerV43.bg)
            .navigationTitle(NSLocalizedString("wrk_v43_report_issue", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("worker_cancel", comment: "")) {
                        resetCreate()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("worker_submit_report", comment: "")) { create() }
                        .disabled(createTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || creating)
                }
            }
            .fullScreenCover(isPresented: $showCreateCamera) {
                CameraPicker(image: $createImage)
            }
        }
    }

    private func label(_ filter: WorkerIssueFilter) -> String {
        switch filter {
        case .open: return String(format: NSLocalizedString("wrk_v43_open_fmt", comment: ""), issues.filter { $0.status == "open" }.count)
        case .mine: return NSLocalizedString("wrk_v43_mine", comment: "")
        case .closed: return NSLocalizedString("wrk_v43_closed", comment: "")
        }
    }

    private func categoryLabel(_ item: WorkerIssueCategory) -> String {
        switch item {
        case .all: return NSLocalizedString("wrk_v43_issue_all", comment: "")
        case .safety: return NSLocalizedString("wrk_v43_issue_safety", comment: "")
        case .quality: return NSLocalizedString("wrk_v43_issue_quality", comment: "")
        case .materials: return NSLocalizedString("wrk_v43_issue_materials", comment: "")
        }
    }

    private func load() {
        errorMessage = nil
        if WorkerV43Preview.isEnabled {
            issues = WorkerV43PreviewCatalog.issues(projectId: project.id)
            loading = false
            return
        }
        loading = issues.isEmpty
        Task {
            do {
                let list = try await WorkerV43API.issues(projectId: project.id)
                await MainActor.run {
                    issues = list
                    loading = false
                }
            } catch {
                await MainActor.run {
                    if issues.isEmpty {
                        errorMessage = WorkerV43Copy.userFacing(error)
                    }
                    loading = false
                }
            }
        }
    }

    private func createDescription() -> String? {
        let typed = createDetail.trimmingCharacters(in: .whitespacesAndNewlines)
        return typed.isEmpty ? nil : typed
    }

    private func resetCreate() {
        showCreate = false
        createTitle = ""
        createDetail = ""
        createImage = nil
        errorMessage = nil
    }

    private func create() {
        let title = createTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        let photo = createImage
        let description = createDescription()
        if WorkerV43Preview.isEnabled {
            issues.insert(
                WorkerIssueDTO(
                    id: "preview-issue-\(UUID().uuidString.prefix(8))",
                    projectId: project.id,
                    title: title,
                    description: description,
                    status: "open",
                    taskId: linkedTaskId,
                    createdAt: nil,
                    updatedAt: nil,
                    evidenceUploadSessionId: photo == nil ? nil : "preview-issue-photo"
                ),
                at: 0
            )
            resetCreate()
            return
        }
        creating = true
        errorMessage = nil
        Task {
            do {
                var sessionId: String?
                if let photo {
                    guard let jpeg = photo.jpegData(compressionQuality: 0.85) else {
                        throw APIError(statusCode: nil, code: nil, message: NSLocalizedString("wrk_v43_issue_photo_encode_failed", comment: ""))
                    }
                    sessionId = try await WorkerAPI.uploadEvidence(purpose: WorkerPhotoKind.issue.rawValue, jpeg: jpeg)
                }
                _ = try await WorkerV43API.createIssue(
                    projectId: project.id,
                    title: title,
                    description: description,
                    taskId: linkedTaskId,
                    idempotencyKey: DeviceContext.newIdempotencyKey(),
                    evidenceUploadSessionId: sessionId
                )
                await MainActor.run {
                    creating = false
                    resetCreate()
                    load()
                }
            } catch {
                await MainActor.run {
                    creating = false
                    errorMessage = WorkerV43Copy.userFacing(error)
                }
            }
        }
    }
}

struct IssueResolutionView: View {
    let project: ProjectDTO
    let issue: WorkerIssueDTO
    @State private var comment = ""
    @State private var image: UIImage?
    @State private var showCamera = false
    @State private var sending = false
    @State private var message: String?
    @State private var currentUserId: String?
    @ObservedObject private var network = NetworkMonitor.shared

    private var canMutate: Bool {
        issue.workerMayMutate(currentUserId: currentUserId)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(issue.title)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                HStack {
                    WorkerV43StatusPill(text: WorkerV43Copy.issueStatus(issue.status), kind: .danger)
                    if canMutate {
                        WorkerV43StatusPill(text: NSLocalizedString("wrk_v43_assigned_you", comment: ""), kind: .info)
                    }
                }
                if let description = issue.description {
                    Text(description).foregroundStyle(WorkerV43.textSecondary)
                }
                if let image {
                    Image(uiImage: image).resizable().scaledToFill().frame(height: 180).clipped()
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                } else if let urlString = issue.evidenceUrl, let url = URL(string: urlString) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let img):
                            img.resizable().scaledToFill().frame(height: 180).clipped()
                        case .failure:
                            Label(
                                NSLocalizedString("wrk_v43_issue_evidence", comment: ""),
                                systemImage: "photo"
                            )
                            .foregroundStyle(WorkerV43.cyan)
                            .frame(maxWidth: .infinity, minHeight: 80)
                            .background(WorkerV43.card)
                        case .empty:
                            ProgressView().frame(maxWidth: .infinity, minHeight: 80)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .accessibilityLabel(NSLocalizedString("wrk_v43_issue_evidence", comment: ""))
                }
                if !network.isConnected {
                    WorkerV43OfflineBanner()
                }
                if let message {
                    Text(message).font(.caption).foregroundStyle(WorkerV43.success)
                }
                if canMutate {
                    WorkerV43PrimaryButton(
                        title: NSLocalizedString("wrk_v43_take_result_photo", comment: ""),
                        systemImage: "camera",
                        fill: WorkerV43.warning
                    ) { showCamera = true }
                    TextField(NSLocalizedString("wrk_v43_issue_comment", comment: ""), text: $comment, axis: .vertical)
                        .padding()
                        .background(WorkerV43.card)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .foregroundStyle(WorkerV43.textPrimary)
                    WorkerV43PrimaryButton(
                        title: NSLocalizedString("wrk_v43_send_review", comment: ""),
                        systemImage: "paperplane.fill",
                        enabled: !sending,
                        loading: sending,
                        fill: WorkerV43.success,
                        ink: .white
                    ) { send() }
                    .accessibilityIdentifier("pilot_worker_issue_send_review")
                    WorkerV43OutlineButton(
                        title: NSLocalizedString("wrk_v43_cannot_fix", comment: ""),
                        systemImage: "exclamationmark.triangle",
                        tint: WorkerV43.danger
                    ) { send(cannotFix: true) }
                    .accessibilityIdentifier("pilot_worker_issue_cannot_fix")
                } else {
                    Text(NSLocalizedString("wrk_v43_issue_view_only", comment: ""))
                        .font(.caption)
                        .foregroundStyle(WorkerV43.textSecondary)
                }
            }
            .padding(WorkerV43.screenX)
        }
        .background(WorkerV43.bg.ignoresSafeArea())
        .accessibilityIdentifier("pilot_worker_issue_resolution")
        .navigationTitle(NSLocalizedString("wrk_v43_issues", comment: ""))
        .fullScreenCover(isPresented: $showCamera) { CameraPicker(image: $image) }
        .onAppear {
            Task { currentUserId = await AuthService.shared.currentSession()?.user.id }
        }
    }

    private func resolutionDescription() -> String {
        var parts: [String] = []
        let typed = comment.trimmingCharacters(in: .whitespacesAndNewlines)
        if !typed.isEmpty {
            parts.append(typed)
        }
        if image != nil {
            parts.append(NSLocalizedString("wrk_v43_issue_photo_queued", comment: ""))
        }
        return parts.joined(separator: "\n")
    }

    private func send(cannotFix: Bool = false) {
        guard canMutate else { return }
        if let image {
            WorkerPhotoEvidence.persistPending(image: image, purpose: WorkerPhotoKind.issue.rawValue, taskId: issue.taskId)
        }
        if WorkerV43Preview.isEnabled {
            message = NSLocalizedString("wrk_v43_issue_sent", comment: "")
            return
        }
        sending = true
        Task {
            do {
                var sessionId: String?
                if let image, let jpeg = image.jpegData(compressionQuality: 0.85) {
                    sessionId = try await WorkerAPI.uploadEvidence(purpose: WorkerPhotoKind.issue.rawValue, jpeg: jpeg)
                }
                _ = try await WorkerV43API.updateIssue(
                    projectId: project.id,
                    issueId: issue.id,
                    status: cannotFix ? "open" : "in_review",
                    description: resolutionDescription(),
                    idempotencyKey: DeviceContext.newIdempotencyKey(),
                    evidenceUploadSessionId: sessionId
                )
                await MainActor.run {
                    sending = false
                    message = NSLocalizedString("wrk_v43_issue_sent", comment: "")
                }
            } catch {
                await MainActor.run {
                    sending = false
                    message = WorkerV43Copy.userFacing(error)
                }
            }
        }
    }
}
