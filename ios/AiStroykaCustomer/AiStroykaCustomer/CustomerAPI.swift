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

    /// Matches GET /api/v1/portal/projects/:id (`ClientProjectView`) with snake_case conversion.
    struct PortalProjectView: Decodable {
        let project: PortalProject
        let progress: Progress
        let milestones: [Milestone]
        let documents: [Document]
        let decisions: [Decision]
        let handover: Handover?

        struct Progress: Decodable {
            let tasksDone: Int
            let tasksTotal: Int
        }

        struct Milestone: Decodable, Identifiable {
            let id: String
            let title: String
            let targetDate: String
            let status: String
        }

        struct Document: Decodable, Identifiable {
            let id: String
            let title: String
            let type: String
            let status: String
            let updatedAt: String
        }

        struct Decision: Decodable, Identifiable {
            let id: String
            let title: String
            let type: String
            let kind: String
        }

        struct Handover: Decodable {
            let status: String
            let handoverNotes: String?
            let handedOverAt: String?
            let completedAt: String?
        }
    }

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
}
