import SwiftUI
import Shared

struct CustomerIntakeListView: View {
    @EnvironmentObject var sessionState: CustomerSessionState
    @State private var drafts: [CustomerIntakeDraft] = []
    @State private var message: String?
    @State private var createMessage: String?
    @State private var loading = true
    @State private var hasLoaded = false
    @State private var loadGeneration = 0
    @State private var title = ""
    @State private var description = ""
    @State private var creating = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(NSLocalizedString("cust_intake_intro", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
                if createMessage != nil || message != nil {
                    VStack(alignment: .leading, spacing: 4) {
                        if let createMessage {
                            Text(createMessage)
                                .font(.caption)
                                .foregroundStyle(CustomerTokens.textSecondary)
                        }
                        if let message {
                            Text(message)
                                .font(.caption)
                                .foregroundStyle(CustomerTokens.textSecondary)
                        }
                    }
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
                    if loading && !hasLoaded {
                        ProgressView()
                    } else if drafts.isEmpty {
                        Text(NSLocalizedString("cust_intake_empty", comment: ""))
                            .foregroundStyle(CustomerTokens.textSecondary)
                    }
                    ForEach(drafts.prefix(20)) { draft in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(draft.title).foregroundStyle(CustomerTokens.textPrimary)
                            Text(draft.status).font(.caption).foregroundStyle(CustomerTokens.textSecondary)
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

    private func resolvedTenantId() -> String? {
        let value = sessionState.tenantId?.trimmingCharacters(in: .whitespacesAndNewlines)
        return (value?.isEmpty == false) ? value : nil
    }

    private func load() async {
        loadGeneration += 1
        let generation = loadGeneration
        let keepVisibleList = hasLoaded
        if !keepVisibleList {
            loading = true
        }
        message = nil
        guard let tenantId = resolvedTenantId() else {
            guard generation == loadGeneration else { return }
            message = NSLocalizedString("cust_intake_load_error", comment: "")
            if !keepVisibleList {
                drafts = []
            }
            if generation == loadGeneration {
                loading = false
            }
            return
        }
        do {
            let rows = try await CustomerAPI.listIntakeDrafts(tenantId: tenantId)
            guard generation == loadGeneration else { return }
            drafts = rows
            hasLoaded = true
        } catch let apiError as APIError {
            guard generation == loadGeneration else { return }
            message = apiError.message
            if !keepVisibleList {
                drafts = []
            }
        } catch {
            guard generation == loadGeneration else { return }
            message = NSLocalizedString("cust_intake_load_error", comment: "")
            if !keepVisibleList {
                drafts = []
            }
        }
        if generation == loadGeneration {
            loading = false
        }
    }

    private func createDraft() async {
        creating = true
        createMessage = nil
        guard let tenantId = resolvedTenantId() else {
            createMessage = NSLocalizedString("cust_intake_create_error", comment: "")
            creating = false
            return
        }
        do {
            _ = try await CustomerAPI.createIntakeDraft(
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                tenantId: tenantId
            )
            title = ""
            description = ""
            createMessage = NSLocalizedString("cust_intake_create_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            createMessage = apiError.message
        } catch {
            createMessage = NSLocalizedString("cust_intake_create_error", comment: "")
        }
        creating = false
    }
}
