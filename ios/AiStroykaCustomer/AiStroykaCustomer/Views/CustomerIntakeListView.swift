import SwiftUI
import Shared

struct CustomerIntakeListView: View {
    let boundProjectId: String?
    let boundProjectName: String?

    init(boundProjectId: String? = nil, boundProjectName: String? = nil) {
        self.boundProjectId = boundProjectId
        self.boundProjectName = boundProjectName
    }

    @State private var drafts: [CustomerIntakeDraft] = []
    @State private var message: String?
    @State private var loading = true
    @State private var title = ""
    @State private var description = ""
    @State private var mediaURL = ""
    @State private var questionsText = ""
    @State private var siteContext = ""
    @State private var locationLabel = ""
    @State private var requestedWorkType = ""
    @State private var desiredStart = ""
    @State private var desiredEnd = ""
    @State private var creating = false
    @State private var editingDraftId: String?
    @State private var editingProjectId: String?
    @State private var editingMediaRefs: [CustomerIntakeMediaRef] = []

    private var visibleDrafts: [CustomerIntakeDraft] {
        guard let boundProjectId, !boundProjectId.isEmpty else { return drafts }
        return drafts.filter { $0.projectId == boundProjectId }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(NSLocalizedString("cust_intake_intro", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
                if let boundProjectName, !boundProjectName.isEmpty {
                    Text(
                        String(
                            format: NSLocalizedString("cust_intake_bound_project", comment: ""),
                            boundProjectName
                        )
                    )
                    .font(.caption)
                    .foregroundStyle(CustomerTokens.textSecondary)
                    .accessibilityIdentifier("pilot_customer_intake_bound_project")
                }
                if let message {
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(CustomerTokens.textSecondary)
                        .accessibilityIdentifier("pilot_customer_intake_status")
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(NSLocalizedString("cust_intake_new_title", comment: ""))
                        .font(.headline)
                        .foregroundStyle(CustomerTokens.textPrimary)
                    TextField(NSLocalizedString("cust_intake_title_placeholder", comment: ""), text: $title)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_intake_title")
                    TextField(NSLocalizedString("cust_intake_description_placeholder", comment: ""), text: $description, axis: .vertical)
                        .lineLimit(3...6)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_intake_description")
                    TextField(NSLocalizedString("cust_intake_site_context_placeholder", comment: ""), text: $siteContext, axis: .vertical)
                        .lineLimit(2...4)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_intake_site_context")
                    TextField(NSLocalizedString("cust_intake_location_placeholder", comment: ""), text: $locationLabel)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_intake_location")
                    TextField(NSLocalizedString("cust_intake_work_type_placeholder", comment: ""), text: $requestedWorkType)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_intake_work_type")
                    TextField(NSLocalizedString("cust_intake_desired_start_placeholder", comment: ""), text: $desiredStart)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityIdentifier("pilot_customer_intake_desired_start")
                    TextField(NSLocalizedString("cust_intake_desired_end_placeholder", comment: ""), text: $desiredEnd)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityIdentifier("pilot_customer_intake_desired_end")
                    Text(NSLocalizedString("cust_intake_desired_dates_hint", comment: ""))
                        .font(.caption2)
                        .foregroundStyle(CustomerTokens.textSecondary)
                    TextField(NSLocalizedString("cust_intake_media_url_placeholder", comment: ""), text: $mediaURL)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .accessibilityIdentifier("pilot_customer_intake_media_url")
                    Text(NSLocalizedString("cust_intake_media_hint", comment: ""))
                        .font(.caption2)
                        .foregroundStyle(CustomerTokens.textSecondary)
                    TextField(NSLocalizedString("cust_intake_questions_placeholder", comment: ""), text: $questionsText, axis: .vertical)
                        .lineLimit(2...5)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_intake_questions")
                    Text(NSLocalizedString("cust_intake_questions_hint", comment: ""))
                        .font(.caption2)
                        .foregroundStyle(CustomerTokens.textSecondary)
                    Button(
                        NSLocalizedString(
                            editingDraftId == nil ? "cust_intake_create" : "cust_intake_update",
                            comment: ""
                        )
                    ) {
                        Task { await saveDraft() }
                    }
                    .disabled(creating || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier(
                        editingDraftId == nil ? "pilot_customer_intake_create" : "pilot_customer_intake_update"
                    )
                    if editingDraftId != nil {
                        Button(NSLocalizedString("cust_intake_cancel_edit", comment: "")) {
                            clearForm()
                        }
                        .accessibilityIdentifier("pilot_customer_intake_cancel_edit")
                    }
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(NSLocalizedString("cust_intake_list_title", comment: ""))
                        .font(.headline)
                        .foregroundStyle(CustomerTokens.textPrimary)
                    if loading {
                        ProgressView()
                    } else if visibleDrafts.isEmpty {
                        Text(NSLocalizedString("cust_intake_empty", comment: ""))
                            .foregroundStyle(CustomerTokens.textSecondary)
                    }
                    ForEach(visibleDrafts.prefix(20)) { draft in
                        VStack(alignment: .leading, spacing: 8) {
                            Button {
                                beginEdit(draft)
                            } label: {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(draft.title).foregroundStyle(CustomerTokens.textPrimary)
                                    Text(draft.status).font(.caption).foregroundStyle(CustomerTokens.textSecondary)
                                    if !draft.mediaRefs.isEmpty {
                                        Text(
                                            String(
                                                format: NSLocalizedString("cust_intake_media_count", comment: ""),
                                                draft.mediaRefs.count
                                            )
                                        )
                                        .font(.caption2)
                                        .foregroundStyle(CustomerTokens.textSecondary)
                                    }
                                    if !draft.questions.isEmpty {
                                        Text(
                                            String(
                                                format: NSLocalizedString("cust_intake_questions_count", comment: ""),
                                                draft.questions.count
                                            )
                                        )
                                        .font(.caption2)
                                        .foregroundStyle(CustomerTokens.textSecondary)
                                    }
                                    if let label = draft.locationLabel, !label.isEmpty {
                                        Text(label)
                                            .font(.caption2)
                                            .foregroundStyle(CustomerTokens.textSecondary)
                                    }
                                    if let projectId = draft.projectId, !projectId.isEmpty {
                                        Text(
                                            String(
                                                format: NSLocalizedString("cust_intake_row_project", comment: ""),
                                                projectId
                                            )
                                        )
                                        .font(.caption2)
                                        .foregroundStyle(CustomerTokens.textSecondary)
                                    }
                                    if let start = draft.desiredStart, !start.isEmpty {
                                        Text(
                                            String(
                                                format: NSLocalizedString("cust_intake_desired_range", comment: ""),
                                                start,
                                                draft.desiredEnd ?? "—"
                                            )
                                        )
                                        .font(.caption2)
                                        .foregroundStyle(CustomerTokens.textSecondary)
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .buttonStyle(.plain)
                            if draft.status == "draft" {
                                HStack {
                                    Button(NSLocalizedString("cust_intake_submit", comment: "")) {
                                        Task { await submitDraft(draft.id) }
                                    }
                                    .buttonStyle(.bordered)
                                    .accessibilityIdentifier("pilot_customer_intake_submit_\(draft.id)")
                                    Button(NSLocalizedString("cust_intake_withdraw", comment: "")) {
                                        Task { await withdrawDraft(draft.id) }
                                    }
                                    .buttonStyle(.bordered)
                                    .accessibilityIdentifier("pilot_customer_intake_withdraw_\(draft.id)")
                                }
                            }
                        }
                        .accessibilityIdentifier("pilot_customer_intake_row_\(draft.id)")
                    }
                }
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(CustomerTokens.canvas.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("cust_intake_nav", comment: ""))
        .accessibilityIdentifier("pilot_customer_intake")
        .task { await load() }
        .refreshable { await load() }
    }

    private func withdrawDraft(_ id: String) async {
        message = nil
        do {
            _ = try await CustomerAPI.withdrawIntakeDraft(id: id)
            let confirmation = NSLocalizedString("cust_intake_withdraw_ok", comment: "")
            await load(preservingMessage: true)
            message = confirmation
        } catch let apiError as APIError {
            message = apiError.message
        } catch {
            message = NSLocalizedString("cust_intake_withdraw_error", comment: "")
        }
    }

    private func load(preservingMessage: Bool = false) async {
        loading = true
        if !preservingMessage {
            message = nil
        }
        do {
            drafts = try await CustomerAPI.listIntakeDrafts(projectId: boundProjectId)
        } catch let apiError as APIError {
            if !preservingMessage {
                message = apiError.message
            }
            drafts = []
        } catch {
            if !preservingMessage {
                message = NSLocalizedString("cust_intake_load_error", comment: "")
            }
            drafts = []
        }
        loading = false
    }

    private func submitDraft(_ id: String) async {
        message = nil
        do {
            _ = try await CustomerAPI.submitIntakeDraft(id: id, projectId: boundProjectId)
            let confirmation = NSLocalizedString("cust_intake_submit_ok", comment: "")
            await load(preservingMessage: true)
            message = confirmation
        } catch let apiError as APIError {
            message = apiError.message
        } catch {
            message = NSLocalizedString("cust_intake_submit_error", comment: "")
        }
    }

    private func beginEdit(_ draft: CustomerIntakeDraft) {
        editingDraftId = draft.id
        editingProjectId = draft.projectId
        title = draft.title
        description = draft.description
        siteContext = draft.siteContext ?? ""
        locationLabel = draft.locationLabel ?? ""
        requestedWorkType = draft.requestedWorkType ?? ""
        desiredStart = draft.desiredStart ?? ""
        desiredEnd = draft.desiredEnd ?? ""
        questionsText = draft.questions.joined(separator: "\n")
        editingMediaRefs = draft.mediaRefs
        mediaURL = draft.mediaRefs.first?.url ?? ""
        message = nil
    }

    private func clearForm() {
        editingDraftId = nil
        editingProjectId = nil
        editingMediaRefs = []
        title = ""
        description = ""
        mediaURL = ""
        questionsText = ""
        siteContext = ""
        locationLabel = ""
        requestedWorkType = ""
        desiredStart = ""
        desiredEnd = ""
    }

    private func saveDraft() async {
        creating = true
        message = nil
        let trimmedURL = mediaURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedURL.isEmpty {
            guard let parsed = URL(string: trimmedURL), parsed.scheme?.lowercased() == "https", parsed.host != nil else {
                message = NSLocalizedString("cust_intake_media_url_invalid", comment: "")
                creating = false
                return
            }
        }
        let refs = editingDraftId == nil
            ? (trimmedURL.isEmpty ? [] : [CustomerIntakeMediaRef(kind: "image", url: trimmedURL)])
            : CustomerIntakeDraft.mergeEditedMediaURL(existing: editingMediaRefs, editedURL: trimmedURL)
        let questions = questionsText
            .split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        func optionalTrimmed(_ value: String) -> String? {
            let t = value.trimmingCharacters(in: .whitespacesAndNewlines)
            return t.isEmpty ? nil : t
        }
        func optionalISODate(_ value: String) -> String? {
            let t = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if t.isEmpty { return nil }
            return CustomerIntakeDraft.isISODate(t) ? t : nil
        }
        if !desiredStart.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           optionalISODate(desiredStart) == nil {
            message = NSLocalizedString("cust_intake_desired_date_invalid", comment: "")
            creating = false
            return
        }
        if !desiredEnd.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           optionalISODate(desiredEnd) == nil {
            message = NSLocalizedString("cust_intake_desired_date_invalid", comment: "")
            creating = false
            return
        }
        do {
            if let draftId = editingDraftId {
                _ = try await CustomerAPI.updateIntakeDraft(
                    id: draftId,
                    title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                    description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                    mediaRefs: refs,
                    questions: questions,
                    siteContext: optionalTrimmed(siteContext),
                    requestedWorkType: optionalTrimmed(requestedWorkType),
                    locationLabel: optionalTrimmed(locationLabel),
                    desiredStart: optionalISODate(desiredStart),
                    desiredEnd: optionalISODate(desiredEnd),
                    projectId: editingProjectId
                )
            } else {
                _ = try await CustomerAPI.createIntakeDraft(
                    title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                    description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                    mediaRefs: refs,
                    questions: questions,
                    siteContext: optionalTrimmed(siteContext),
                    requestedWorkType: optionalTrimmed(requestedWorkType),
                    locationLabel: optionalTrimmed(locationLabel),
                    desiredStart: optionalISODate(desiredStart),
                    desiredEnd: optionalISODate(desiredEnd),
                    projectId: boundProjectId
                )
            }
            clearForm()
            message = NSLocalizedString("cust_intake_create_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            message = apiError.message
        } catch {
            message = NSLocalizedString("cust_intake_create_error", comment: "")
        }
        creating = false
    }
}
