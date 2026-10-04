import SwiftUI
import Shared

struct CustomerProjectDetailView: View {
    let projectId: String
    let fallbackName: String
    @State private var view: CustomerPortalProjectView?
    @State private var message: String?
    @State private var loading = true
    @State private var respondingRequestId: String?
    @State private var respondMessage: String?

    var body: some View {
        Group {
            if loading {
                CustomerStatusView(kind: .loading, message: NSLocalizedString("cust_project_loading", comment: ""))
            } else if let message, view == nil {
                CustomerStatusView(
                    kind: .error,
                    message: message,
                    actionTitle: NSLocalizedString("cust_retry", comment: ""),
                    action: { Task { await load() } }
                )
            } else if let view {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if let message {
                            refreshFailureBanner(message)
                        }
                        Text(view.project.name)
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(CustomerTokens.textPrimary)
                        progressBlock(view.progress)
                        if let handover = view.handover {
                            labeled(NSLocalizedString("cust_project_status", comment: ""), value: handover.status)
                        }
                        activitySection(view)
                        requestsSection(view.clientRequests)
                        estimatesSection(view.customerEstimates)
                        documentsSection(view.documents)
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(CustomerTokens.canvas.ignoresSafeArea())
                .refreshable { await load() }
                .accessibilityIdentifier("pilot_customer_project_detail")
            }
        }
        .navigationTitle(view?.project.name ?? fallbackName)
        .task { await load() }
    }

    private func refreshFailureBanner(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(text)
                .foregroundStyle(CustomerTokens.textPrimary)
            Button(NSLocalizedString("cust_retry", comment: "")) {
                Task { await load() }
            }
            .accessibilityIdentifier("pilot_customer_project_refresh_retry")
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CustomerTokens.fieldFill)
        .accessibilityIdentifier("pilot_customer_project_refresh_error")
    }

    private func progressBlock(_ progress: CustomerPortalProjectView.Progress) -> some View {
        let total = max(progress.tasksTotal, 0)
        let done = min(max(progress.tasksDone, 0), total)
        let label = total == 0
            ? NSLocalizedString("cust_progress_none", comment: "")
            : String(format: NSLocalizedString("cust_progress_fmt", comment: ""), done, total)
        return VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_progress_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            Text(label)
                .foregroundStyle(CustomerTokens.textSecondary)
        }
    }

    private func activitySection(_ view: CustomerPortalProjectView) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_activity_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            if view.milestones.isEmpty && view.decisions.isEmpty {
                Text(NSLocalizedString("cust_activity_empty", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
            }
            ForEach(view.milestones.prefix(5)) { item in
                labeled(item.title, value: item.status)
            }
            ForEach(view.decisions.prefix(5)) { item in
                labeled(item.title, value: item.kind)
            }
        }
    }

    private func requestsSection(_ requests: [CustomerPortalProjectView.CustomerFacingRequest]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_requests_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            if let respondMessage {
                Text(respondMessage)
                    .font(.caption)
                    .foregroundStyle(CustomerTokens.textSecondary)
                    .accessibilityIdentifier("pilot_customer_request_respond_status")
            }
            if requests.isEmpty {
                Text(NSLocalizedString("cust_requests_empty", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
            }
            ForEach(requests.prefix(8)) { item in
                let amount: String? = {
                    guard let value = item.customerVisibleAmount,
                          let code = item.customerVisibleCurrency?.trimmingCharacters(in: .whitespacesAndNewlines),
                          !code.isEmpty
                    else { return nil }
                    return CustomerPortalProjectView.formatCustomerAmount(amount: value, currency: code)
                }()
                VStack(alignment: .leading, spacing: 8) {
                    labeled(item.title, value: amount.map { "\(item.status) · \($0)" } ?? item.status)
                    if let portal = view, portal.canRespondApproveReject(to: item) {
                        HStack(spacing: 12) {
                            Button(NSLocalizedString("cust_request_approve", comment: "")) {
                                Task { await respond(to: item, decision: "approve") }
                            }
                            .disabled(respondingRequestId != nil)
                            .accessibilityIdentifier("pilot_customer_request_approve_\(item.id)")
                            Button(NSLocalizedString("cust_request_reject", comment: "")) {
                                Task { await respond(to: item, decision: "reject") }
                            }
                            .disabled(respondingRequestId != nil)
                            .accessibilityIdentifier("pilot_customer_request_reject_\(item.id)")
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
        .accessibilityIdentifier("pilot_customer_project_requests")
    }

    private func respond(to item: CustomerPortalProjectView.CustomerFacingRequest, decision: String) async {
        respondingRequestId = item.id
        respondMessage = nil
        do {
            try await CustomerAPI.respondToPortalDecision(
                projectId: projectId,
                requestId: item.id,
                decision: decision
            )
            respondMessage = NSLocalizedString("cust_request_respond_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            respondMessage = apiError.message
        } catch {
            respondMessage = NSLocalizedString("cust_request_respond_error", comment: "")
        }
        respondingRequestId = nil
    }

    private func estimatesSection(_ estimates: [CustomerPortalProjectView.CustomerFacingEstimate]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_estimates_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            if estimates.isEmpty {
                Text(NSLocalizedString("cust_estimates_empty", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
            }
            ForEach(estimates.prefix(8)) { item in
                let amount = CustomerPortalProjectView.formatCustomerAmount(
                    amount: item.totalAmount,
                    currency: item.currency
                )
                labeled(item.title, value: "\(item.status) · \(amount)")
            }
        }
        .accessibilityIdentifier("pilot_customer_project_estimates")
    }

    private func documentsSection(_ docs: [CustomerPortalProjectView.Document]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_documents_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            if docs.isEmpty {
                Text(NSLocalizedString("cust_documents_empty", comment: ""))
                    .foregroundStyle(CustomerTokens.textSecondary)
            }
            ForEach(docs.prefix(8)) { doc in
                labeled(doc.title, value: doc.status)
            }
        }
    }

    private func labeled(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).foregroundStyle(CustomerTokens.textPrimary)
            Text(value).font(.caption).foregroundStyle(CustomerTokens.textSecondary)
        }
    }

    private func load() async {
        let keepVisibleView = view != nil
        if !keepVisibleView {
            loading = true
        }
        message = nil
        do {
            view = try await CustomerAPI.portalProject(id: projectId)
        } catch let apiError as APIError {
            message = apiError.message
            if !keepVisibleView {
                view = nil
            }
        } catch {
            message = NSLocalizedString("cust_project_error", comment: "")
            if !keepVisibleView {
                view = nil
            }
        }
        loading = false
    }
}
