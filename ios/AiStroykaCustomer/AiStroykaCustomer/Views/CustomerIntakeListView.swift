import SwiftUI
import Shared

struct CustomerIntakeListView: View {
    @State private var drafts: [CustomerIntakeDraft] = []
    @State private var message: String?
    @State private var loading = true
    @State private var title = ""
    @State private var description = ""
    @State private var mediaURL = ""
    @State private var questionsText = ""
    @State private var creating = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(NSLocalizedString("cust_intake_intro", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
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
                    Button(NSLocalizedString("cust_intake_create", comment: "")) {
                        Task { await createDraft() }
                    }
                    .disabled(creating || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier("pilot_customer_intake_create")
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(NSLocalizedString("cust_intake_list_title", comment: ""))
                        .font(.headline)
                        .foregroundStyle(CustomerTokens.textPrimary)
                    if loading {
                        ProgressView()
                    } else if drafts.isEmpty {
                        Text(NSLocalizedString("cust_intake_empty", comment: ""))
                            .foregroundStyle(CustomerTokens.textSecondary)
                    }
                    ForEach(drafts.prefix(20)) { draft in
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

    private func load() async {
        loading = true
        message = nil
        do {
            drafts = try await CustomerAPI.listIntakeDrafts()
        } catch let apiError as APIError {
            message = apiError.message
            drafts = []
        } catch {
            message = NSLocalizedString("cust_intake_load_error", comment: "")
            drafts = []
        }
        loading = false
    }

    private func createDraft() async {
        creating = true
        message = nil
        let trimmedURL = mediaURL.trimmingCharacters(in: .whitespacesAndNewlines)
        var refs: [CustomerIntakeMediaRef] = []
        if !trimmedURL.isEmpty {
            guard let parsed = URL(string: trimmedURL), parsed.scheme?.lowercased() == "https", parsed.host != nil else {
                message = NSLocalizedString("cust_intake_media_url_invalid", comment: "")
                creating = false
                return
            }
            refs = [CustomerIntakeMediaRef(kind: "image", url: trimmedURL)]
        }
        let questions = questionsText
            .split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        do {
            _ = try await CustomerAPI.createIntakeDraft(
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                mediaRefs: refs,
                questions: questions
            )
            title = ""
            description = ""
            mediaURL = ""
            questionsText = ""
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
