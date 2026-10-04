import Foundation

/// Customer-safe GET /api/v1/portal/projects/:id (`ClientProjectView`) under convertFromSnakeCase.
/// Contractor-internal finance and actor ids are not modeled and must not be decoded into UI state.
public struct CustomerPortalProjectView: Decodable, Sendable {
    public let project: Project
    public let progress: Progress
    public let milestones: [Milestone]
    public let documents: [Document]
    public let decisions: [Decision]
    public let handover: Handover?
    public let customerEstimates: [CustomerFacingEstimate]
    public let clientRequests: [CustomerFacingRequest]
    public let capabilities: Capabilities?

    public struct Project: Decodable, Identifiable, Hashable, Sendable {
        public let id: String
        public let name: String
    }

    public struct Progress: Decodable, Sendable {
        public let tasksDone: Int
        public let tasksTotal: Int
    }

    public struct Milestone: Decodable, Identifiable, Sendable {
        public let id: String
        public let title: String
        public let targetDate: String
        public let status: String
    }

    public struct Document: Decodable, Identifiable, Sendable {
        public let id: String
        public let title: String
        public let type: String
        public let status: String
        public let updatedAt: String
    }

    public struct Decision: Decodable, Identifiable, Sendable {
        public let id: String
        public let title: String
        public let type: String
        public let kind: String
    }

    public struct Handover: Decodable, Sendable {
        public let status: String
        public let handoverNotes: String?
        public let handedOverAt: String?
        public let completedAt: String?
    }

    public struct CustomerFacingEstimate: Decodable, Identifiable, Sendable {
        public let id: String
        public let title: String
        public let description: String?
        public let status: String
        public let totalAmount: Double
        public let currency: String
        public let validUntil: String?
        public let customerNote: String?

        /// Estimates awaiting customer decision (`sent` only).
        public var supportsApproveReject: Bool {
            status == "sent"
        }
    }

    public struct CustomerFacingRequest: Decodable, Identifiable, Sendable {
        public let id: String
        public let kind: String
        public let actionMode: String
        public let status: String
        public let title: String
        public let instructions: String?
        public let customerVisibleAmount: Double?
        public let customerVisibleCurrency: String?
        public let dueAt: String?

        /// Open action-required requests that use approve/reject (`approve_or_reject` kind only).
        public var supportsApproveReject: Bool {
            status == "open" && actionMode == "action_required" && kind == "approve_or_reject"
        }

        /// Open action-required document_review requests (confirm-only).
        public var supportsDocumentReviewConfirm: Bool {
            status == "open" && actionMode == "action_required" && kind == "document_review"
        }
    }

    public struct Capabilities: Decodable, Sendable {
        public let canRespondToRequests: Bool
    }

    /// True when this portal view may submit approve/reject for the given request.
    public func canRespondApproveReject(to request: CustomerFacingRequest) -> Bool {
        (capabilities?.canRespondToRequests ?? false) && request.supportsApproveReject
    }

    /// True when this portal view may approve/reject a sent customer estimate.
    public func canRespondApproveReject(to estimate: CustomerFacingEstimate) -> Bool {
        (capabilities?.canRespondToRequests ?? false) && estimate.supportsApproveReject
    }

    public func canConfirmDocumentReview(to request: CustomerFacingRequest) -> Bool {
        (capabilities?.canRespondToRequests ?? false) && request.supportsDocumentReviewConfirm
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        project = try c.decode(Project.self, forKey: .project)
        progress = try c.decode(Progress.self, forKey: .progress)
        milestones = try c.decodeIfPresent([Milestone].self, forKey: .milestones) ?? []
        documents = try c.decodeIfPresent([Document].self, forKey: .documents) ?? []
        decisions = try c.decodeIfPresent([Decision].self, forKey: .decisions) ?? []
        handover = try c.decodeIfPresent(Handover.self, forKey: .handover)
        customerEstimates = try c.decodeIfPresent([CustomerFacingEstimate].self, forKey: .customerEstimates) ?? []
        clientRequests = try c.decodeIfPresent([CustomerFacingRequest].self, forKey: .clientRequests) ?? []
        capabilities = try c.decodeIfPresent(Capabilities.self, forKey: .capabilities)
    }

    enum CodingKeys: String, CodingKey {
        case project, progress, milestones, documents, decisions, handover
        case customerEstimates, clientRequests, capabilities
    }

    public static func decodePortalJSON(_ data: Data) throws -> CustomerPortalProjectView {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(CustomerPortalProjectView.self, from: data)
    }

    public static func formatCustomerAmount(amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.uppercased()
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: amount)) ?? "\(amount) \(currency)"
    }
}
