import Foundation
import Shared

enum CustomerAPI {
    struct Envelope<T: Decodable>: Decodable {
        let data: T
    }

    struct MeResponse: Decodable {
        let data: Payload?
        struct Payload: Decodable {
            let tenant_id: String?
            let user_id: String?
            let role: String?
            let email: String?
            enum CodingKeys: String, CodingKey {
                case tenant_id, user_id, role, email
                case tenantId = "tenantId"
                case userId = "userId"
            }

            init(from decoder: Decoder) throws {
                let c = try decoder.container(keyedBy: CodingKeys.self)
                tenant_id = try c.decodeIfPresent(String.self, forKey: .tenant_id) ?? c.decodeIfPresent(String.self, forKey: .tenantId)
                user_id = try c.decodeIfPresent(String.self, forKey: .user_id) ?? c.decodeIfPresent(String.self, forKey: .userId)
                role = try c.decodeIfPresent(String.self, forKey: .role)
                email = try c.decodeIfPresent(String.self, forKey: .email)
            }
        }
    }

    struct PortalProject: Decodable, Identifiable, Hashable {
        let id: String
        let name: String
    }

    typealias PortalProjectView = CustomerPortalProjectView

    static func me() async throws -> MeResponse {
        try await APIClient.shared.request(path: "me")
    }

    static func portalProjects() async throws -> [PortalProject] {
        let env: Envelope<[PortalProject]> = try await APIClient.shared.request(path: "portal/projects")
        return env.data
    }

    static func portalProject(id: String) async throws -> PortalProjectView {
        let env: Envelope<PortalProjectView> = try await APIClient.shared.request(path: "portal/projects/\(id)")
        return env.data
    }

    /// POST /api/v1/portal/projects/:id/decisions/:requestId/respond
    static func respondToPortalDecision(
        projectId: String,
        requestId: String,
        decision: String,
        note: String? = nil
    ) async throws {
        struct Body: Encodable {
            let decision: String
            let note: String?
        }
        struct EmptyData: Decodable {}
        let _: Envelope<EmptyData> = try await APIClient.shared.request(
            path: "portal/projects/\(projectId)/decisions/\(requestId)/respond",
            method: "POST",
            body: Body(decision: decision, note: note)
        )
    }

    /// POST /api/v1/projects/:id/estimates/:estimateId/respond (customer-safe path used by web portal).
    static func respondToEstimate(
        projectId: String,
        estimateId: String,
        decision: String,
        note: String? = nil
    ) async throws {
        struct Body: Encodable {
            let decision: String
            let note: String?
        }
        struct EmptyData: Decodable {}
        let _: Envelope<EmptyData> = try await APIClient.shared.request(
            path: "projects/\(projectId)/estimates/\(estimateId)/respond",
            method: "POST",
            body: Body(decision: decision, note: note)
        )
    }

    /// POST portal decisions respond with document_review_confirmed=true
    static func confirmDocumentReview(projectId: String, requestId: String, note: String? = nil) async throws {
        struct Body: Encodable {
            let documentReviewConfirmed: Bool
            let note: String?

            enum CodingKeys: String, CodingKey {
                case documentReviewConfirmed = "document_review_confirmed"
                case note
            }
        }
        struct EmptyData: Decodable {}
        let _: Envelope<EmptyData> = try await APIClient.shared.request(
            path: "portal/projects/\(projectId)/decisions/\(requestId)/respond",
            method: "POST",
            body: Body(documentReviewConfirmed: true, note: note)
        )
    }

    /// POST portal decisions respond with feedback_text
    static func submitFeedback(projectId: String, requestId: String, feedbackText: String, note: String? = nil) async throws {
        struct Body: Encodable {
            let feedbackText: String
            let note: String?
            enum CodingKeys: String, CodingKey {
                case feedbackText = "feedback_text"
                case note
            }
        }
        struct EmptyData: Decodable {}
        let _: Envelope<EmptyData> = try await APIClient.shared.request(
            path: "portal/projects/\(projectId)/decisions/\(requestId)/respond",
            method: "POST",
            body: Body(feedbackText: feedbackText, note: note)
        )
    }

    /// POST portal decisions respond with acknowledged=true
    static func acknowledgeRequest(projectId: String, requestId: String, note: String? = nil) async throws {
        struct Body: Encodable {
            let acknowledged: Bool
            let note: String?
        }
        struct EmptyData: Decodable {}
        let _: Envelope<EmptyData> = try await APIClient.shared.request(
            path: "portal/projects/\(projectId)/decisions/\(requestId)/respond",
            method: "POST",
            body: Body(acknowledged: true, note: note)
        )
    }

    /// POST portal decisions respond with choice_index
    static func submitChoice(projectId: String, requestId: String, choiceIndex: Int, note: String? = nil) async throws {
        struct Body: Encodable {
            let choiceIndex: Int
            let note: String?
            enum CodingKeys: String, CodingKey {
                case choiceIndex = "choice_index"
                case note
            }
        }
        struct EmptyData: Decodable {}
        let _: Envelope<EmptyData> = try await APIClient.shared.request(
            path: "portal/projects/\(projectId)/decisions/\(requestId)/respond",
            method: "POST",
            body: Body(choiceIndex: choiceIndex, note: note)
        )
    }

    static func listIntakeDrafts() async throws -> [CustomerIntakeDraft] {
        let env: Envelope<[CustomerIntakeDraft]> = try await APIClient.shared.request(path: "portal/intake")
        return env.data
    }

    static func createIntakeDraft(
        title: String,
        description: String,
        mediaRefs: [CustomerIntakeMediaRef] = [],
        questions: [String] = [],
        siteContext: String? = nil,
        requestedWorkType: String? = nil,
        locationLabel: String? = nil,
        desiredStart: String? = nil,
        desiredEnd: String? = nil
    ) async throws -> CustomerIntakeDraft {
        struct LocationBody: Encodable {
            let precision: String
            let label: String?
        }
        struct Body: Encodable {
            let title: String
            let description: String
            let mediaRefs: [CustomerIntakeMediaRef]
            let questions: [String]
            let siteContext: String?
            let requestedWorkType: String?
            let location: LocationBody?
            let desiredStart: String?
            let desiredEnd: String?

            enum CodingKeys: String, CodingKey {
                case title, description, questions, location
                case mediaRefs = "media_refs"
                case siteContext = "site_context"
                case requestedWorkType = "requested_work_type"
                case desiredStart = "desired_start"
                case desiredEnd = "desired_end"
            }
        }
        let location: LocationBody? = {
            guard let label = locationLabel?.trimmingCharacters(in: .whitespacesAndNewlines), !label.isEmpty else {
                return nil
            }
            return LocationBody(precision: "city", label: label)
        }()
        let env: Envelope<CustomerIntakeDraft> = try await APIClient.shared.request(
            path: "portal/intake",
            method: "POST",
            body: Body(
                title: title,
                description: description,
                mediaRefs: mediaRefs,
                questions: questions,
                siteContext: siteContext,
                requestedWorkType: requestedWorkType,
                location: location,
                desiredStart: desiredStart,
                desiredEnd: desiredEnd
            )
        )
        return env.data
    }
}
