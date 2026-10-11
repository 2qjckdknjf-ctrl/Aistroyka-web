import SwiftUI
import ImageIO
import Shared

struct CustomerProjectDetailView: View {
    let projectId: String
    let fallbackName: String
    @State private var view: CustomerPortalProjectView?
    @State private var message: String?
    @State private var loading = true
    @State private var accessDenied = false
    @State private var loadGeneration = 0
    @State private var respondingRequestId: String?
    @State private var respondingEstimateId: String?
    @State private var respondMessage: String?
    @State private var feedbackDrafts: [String: String] = [:]

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
                .accessibilityIdentifier("pilot_customer_project_unavailable")
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
                            handoverSection(handover)
                        }
                        if let respondMessage {
                            Text(respondMessage)
                                .font(.caption)
                                .foregroundStyle(CustomerTokens.textSecondary)
                                .accessibilityIdentifier("pilot_customer_respond_status")
                        }
                        activitySection(view)
                        requestsSection(view.clientRequests)
                        estimatesSection(view.customerEstimates)
                        documentsSection(view.documents)
                        CustomerPublishedPhotosSection(projectId: projectId, refreshGeneration: loadGeneration)
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(CustomerTokens.canvas.ignoresSafeArea())
                .modifier(CustomerProjectScrollBounce())
                .refreshable { await load() }
                .accessibilityIdentifier("pilot_customer_project_detail")
            }
        }
        .navigationTitle(accessDenied ? NSLocalizedString("cust_home_title", comment: "") : (view?.project.name ?? fallbackName))
        .toolbar {
            if view != nil {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        Task { await load() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel(NSLocalizedString("cust_refresh_project", comment: ""))
                    .accessibilityIdentifier("pilot_customer_project_refresh")
                    NavigationLink {
                        CustomerIntakeListView(
                            boundProjectId: projectId,
                            boundProjectName: view?.project.name ?? fallbackName
                        )
                    } label: {
                        Text(NSLocalizedString("cust_intake_nav", comment: ""))
                    }
                    .accessibilityIdentifier("pilot_customer_project_intake_nav")
                }
            }
        }
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
                            .disabled(respondingRequestId != nil || respondingEstimateId != nil)
                            .accessibilityIdentifier("pilot_customer_request_approve_\(item.id)")
                            Button(NSLocalizedString("cust_request_reject", comment: "")) {
                                Task { await respond(to: item, decision: "reject") }
                            }
                            .disabled(respondingRequestId != nil || respondingEstimateId != nil)
                            .accessibilityIdentifier("pilot_customer_request_reject_\(item.id)")
                        }
                        .buttonStyle(.bordered)
                    } else if let portal = view, portal.canConfirmDocumentReview(to: item) {
                        Button(NSLocalizedString("cust_document_review_confirm", comment: "")) {
                            Task { await confirmDocumentReview(item) }
                        }
                        .disabled(respondingRequestId != nil || respondingEstimateId != nil)
                        .buttonStyle(.bordered)
                        .accessibilityIdentifier("pilot_customer_document_review_confirm_\(item.id)")
                    } else if let portal = view, portal.canSubmitFeedback(to: item) {
                        TextField(
                            NSLocalizedString("cust_feedback_placeholder", comment: ""),
                            text: Binding(
                                get: { feedbackDrafts[item.id] ?? "" },
                                set: { feedbackDrafts[item.id] = $0 }
                            ),
                            axis: .vertical
                        )
                        .lineLimit(2...4)
                        .textFieldStyle(.roundedBorder)
                        .accessibilityIdentifier("pilot_customer_feedback_field_\(item.id)")
                        Button(NSLocalizedString("cust_feedback_submit", comment: "")) {
                            Task { await submitFeedback(item) }
                        }
                        .disabled(
                            respondingRequestId != nil
                                || respondingEstimateId != nil
                                || (feedbackDrafts[item.id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                        )
                        .buttonStyle(.bordered)
                        .accessibilityIdentifier("pilot_customer_feedback_submit_\(item.id)")
                    } else if let portal = view, portal.canAcknowledge(to: item) {
                        Button(NSLocalizedString("cust_acknowledge", comment: "")) {
                            Task { await acknowledge(item) }
                        }
                        .disabled(respondingRequestId != nil || respondingEstimateId != nil)
                        .buttonStyle(.bordered)
                        .accessibilityIdentifier("pilot_customer_acknowledge_\(item.id)")
                    } else if let portal = view, portal.canSubmitChoice(to: item), let options = item.choiceOptions {
                        ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                            Button(option) {
                                Task { await submitChoice(item, index: index) }
                            }
                            .disabled(respondingRequestId != nil || respondingEstimateId != nil)
                            .buttonStyle(.bordered)
                            .accessibilityIdentifier("pilot_customer_choice_\(item.id)_\(index)")
                        }
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

    private func confirmDocumentReview(_ item: CustomerPortalProjectView.CustomerFacingRequest) async {
        respondingRequestId = item.id
        respondMessage = nil
        do {
            try await CustomerAPI.confirmDocumentReview(projectId: projectId, requestId: item.id)
            respondMessage = NSLocalizedString("cust_document_review_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            respondMessage = apiError.message
        } catch {
            respondMessage = NSLocalizedString("cust_document_review_error", comment: "")
        }
        respondingRequestId = nil
    }



    private func submitChoice(_ item: CustomerPortalProjectView.CustomerFacingRequest, index: Int) async {
        respondingRequestId = item.id
        respondMessage = nil
        do {
            try await CustomerAPI.submitChoice(projectId: projectId, requestId: item.id, choiceIndex: index)
            respondMessage = NSLocalizedString("cust_choice_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            respondMessage = apiError.message
        } catch {
            respondMessage = NSLocalizedString("cust_choice_error", comment: "")
        }
        respondingRequestId = nil
    }

    private func acknowledge(_ item: CustomerPortalProjectView.CustomerFacingRequest) async {
        respondingRequestId = item.id
        respondMessage = nil
        do {
            try await CustomerAPI.acknowledgeRequest(projectId: projectId, requestId: item.id)
            respondMessage = NSLocalizedString("cust_acknowledge_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            respondMessage = apiError.message
        } catch {
            respondMessage = NSLocalizedString("cust_acknowledge_error", comment: "")
        }
        respondingRequestId = nil
    }

    private func submitFeedback(_ item: CustomerPortalProjectView.CustomerFacingRequest) async {
        let text = (feedbackDrafts[item.id] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        respondingRequestId = item.id
        respondMessage = nil
        do {
            try await CustomerAPI.submitFeedback(projectId: projectId, requestId: item.id, feedbackText: text)
            respondMessage = NSLocalizedString("cust_feedback_ok", comment: "")
            feedbackDrafts[item.id] = nil
            await load()
        } catch let apiError as APIError {
            respondMessage = apiError.message
        } catch {
            respondMessage = NSLocalizedString("cust_feedback_error", comment: "")
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
                VStack(alignment: .leading, spacing: 8) {
                    labeled(item.title, value: "\(item.status) · \(amount)")
                    if let portal = view, portal.canRespondApproveReject(to: item) {
                        HStack(spacing: 12) {
                            Button(NSLocalizedString("cust_request_approve", comment: "")) {
                                Task { await respond(to: item, decision: "approve") }
                            }
                            .disabled(respondingEstimateId != nil || respondingRequestId != nil)
                            .accessibilityIdentifier("pilot_customer_estimate_approve_\(item.id)")
                            Button(NSLocalizedString("cust_request_reject", comment: "")) {
                                Task { await respond(to: item, decision: "reject") }
                            }
                            .disabled(respondingEstimateId != nil || respondingRequestId != nil)
                            .accessibilityIdentifier("pilot_customer_estimate_reject_\(item.id)")
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
        .accessibilityIdentifier("pilot_customer_project_estimates")
    }

    private func respond(to item: CustomerPortalProjectView.CustomerFacingEstimate, decision: String) async {
        respondingEstimateId = item.id
        respondMessage = nil
        do {
            try await CustomerAPI.respondToEstimate(
                projectId: projectId,
                estimateId: item.id,
                decision: decision
            )
            respondMessage = NSLocalizedString("cust_estimate_respond_ok", comment: "")
            await load()
        } catch let apiError as APIError {
            respondMessage = apiError.message
        } catch {
            respondMessage = NSLocalizedString("cust_estimate_respond_error", comment: "")
        }
        respondingEstimateId = nil
    }

    private func handoverSection(_ handover: CustomerPortalProjectView.Handover) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_handover_title", comment: ""))
                .font(.headline)
                .foregroundStyle(CustomerTokens.textPrimary)
            labeled(NSLocalizedString("cust_project_status", comment: ""), value: handover.status)
            if let notes = handover.handoverNotes?.trimmingCharacters(in: .whitespacesAndNewlines), !notes.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    Text(NSLocalizedString("cust_handover_notes", comment: ""))
                        .foregroundStyle(CustomerTokens.textPrimary)
                    Text(notes)
                        .font(.caption)
                        .foregroundStyle(CustomerTokens.textSecondary)
                }
                .accessibilityIdentifier("pilot_customer_handover_notes")
            }
            if let handedOverAt = handover.handedOverAt, !handedOverAt.isEmpty {
                labeled(NSLocalizedString("cust_handover_handed_over_at", comment: ""), value: handedOverAt)
            }
            if let completedAt = handover.completedAt, !completedAt.isEmpty {
                labeled(NSLocalizedString("cust_handover_completed_at", comment: ""), value: completedAt)
            }
        }
        .accessibilityIdentifier("pilot_customer_handover")
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
        loadGeneration &+= 1
        let generation = loadGeneration
        let keepVisibleView = view != nil
        if !keepVisibleView {
            loading = true
        }
        message = nil
        do {
            let latest = try await CustomerAPI.portalProject(id: projectId)
            guard generation == loadGeneration else { return }
            view = latest
            accessDenied = false
        } catch let apiError as APIError {
            guard generation == loadGeneration else { return }
            message = apiError.message
            accessDenied = apiError.isUnauthorized || apiError.isForbidden || apiError.statusCode == 404
            if !keepVisibleView || accessDenied {
                view = nil
                feedbackDrafts = [:]
                respondMessage = nil
            }
        } catch {
            guard generation == loadGeneration else { return }
            message = NSLocalizedString("cust_project_error", comment: "")
            if !keepVisibleView {
                view = nil
            }
        }
        loading = false
    }
}

private struct CustomerPublishedPhotosSection: View {
    let projectId: String
    let refreshGeneration: Int
    @Environment(\.scenePhase) private var scenePhase
    @State private var photos: [CustomerPublishedEvidence.Item] = []
    @State private var message: String?
    @State private var loading = true
    @State private var generation = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("cust_photos_title", comment: "")).font(.headline)
            if loading && photos.isEmpty {
                ProgressView()
            } else if let message {
                Text(message).foregroundStyle(CustomerTokens.textSecondary)
                Button(NSLocalizedString("cust_retry", comment: "")) { Task { await load() } }
            } else if photos.isEmpty {
                Text(NSLocalizedString("cust_portalPhotosEmpty", comment: "")).foregroundStyle(CustomerTokens.textSecondary)
            } else {
                ForEach(photos.prefix(9)) { photo in
                    CustomerPublishedPhotoCard(projectId: projectId, photo: photo) { Task { await load() } }
                }
            }
        }
        .accessibilityIdentifier("pilot_customer_published_photos")
        .task(id: refreshGeneration) {
            await load()
            while !Task.isCancelled {
                do { try await Task.sleep(nanoseconds: 30_000_000_000) } catch { break }
                if scenePhase == .active { await load() }
            }
        }
        .onChange(of: scenePhase) { phase in if phase == .active { Task { await load() } } }
    }

    @MainActor private func load() async {
        generation += 1
        let current = generation
        loading = true
        do {
            let latest = try await CustomerAPI.publishedPhotos(projectId: projectId)
            guard current == generation, !Task.isCancelled else { return }
            photos = latest
            message = nil
        } catch {
            guard current == generation, !Task.isCancelled else { return }
            photos = []
            let api = error as? APIError
            let denied = api?.isUnauthorized == true || api?.isForbidden == true || api?.statusCode == 404
            message = NSLocalizedString(denied ? "cust_portalPhotosAccessUnavailable" : "cust_portalPhotosLoadError", comment: "")
        }
        loading = false
    }
}

private struct CustomerPublishedPhotoCard: View {
    let projectId: String
    let photo: CustomerPublishedEvidence.Item
    let onUnavailable: () -> Void
    @State private var image: UIImage?
    @State private var failed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let image {
                Image(uiImage: image).resizable().scaledToFit()
                    .frame(maxHeight: 260)
                    .accessibilityElement(children: .ignore)
                    .accessibilityAddTraits(.isImage)
                    .accessibilityLabel(photo.zoneLabel ?? NSLocalizedString("cust_photos_title", comment: ""))
                    .accessibilityIdentifier("pilot_customer_published_photo_image_\(photo.id)")
                Text(NSLocalizedString("cust_portalPhotosVerified", comment: "")).font(.caption)
            } else if failed {
                Text(NSLocalizedString("cust_portalPhotosOriginalUnavailable", comment: ""))
                Button(NSLocalizedString("cust_retry", comment: "")) { Task { await load() } }
            } else { ProgressView() }
            if let zone = photo.zoneLabel { Text(zone).font(.caption) }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("pilot_customer_published_photo_\(photo.id)")
        .task(id: photo.updatedAt) { await load() }
    }

    @MainActor private func load() async {
        image = nil
        failed = false
        do {
            let project = projectId, evidence = photo.id
            let loaded = try await PhotoPreviewQueue.shared.run {
                let data = try await APIClient.shared.requestPublishedPhoto(projectId: project, evidenceId: evidence)
                try Task.checkCancellation()
                guard let source = CGImageSourceCreateWithData(data as CFData, [kCGImageSourceShouldCache: false] as CFDictionary),
                      let preview = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                        kCGImageSourceCreateThumbnailFromImageAlways: true,
                        kCGImageSourceCreateThumbnailWithTransform: true,
                        kCGImageSourceThumbnailMaxPixelSize: 1200,
                        kCGImageSourceShouldCacheImmediately: true,
                      ] as CFDictionary) else { throw APIError(statusCode: 415, code: nil, message: "Invalid photo") }
                try Task.checkCancellation()
                return CustomerPhotoPreview(image: UIImage(cgImage: preview))
            }
            guard !Task.isCancelled else { return }
            image = loaded.image
        } catch {
            guard !Task.isCancelled else { return }
            image = nil
            failed = true
            onUnavailable()
        }
    }
}

/// The completed immutable preview crosses to MainActor; original bytes never do.
private struct CustomerPhotoPreview: @unchecked Sendable {
    let image: UIImage
}

private struct CustomerProjectScrollBounce: ViewModifier {
    @ViewBuilder
    func body(content: Content) -> some View {
        if #available(iOS 16.4, *) {
            content.scrollBounceBehavior(.always)
        } else {
            content
        }
    }
}
