import Foundation

/// Public projection only: no actor, device, Storage, provenance or financial fields.
public struct CustomerPublishedEvidence: Decodable, Sendable {
    public struct Project: Decodable, Sendable { public let id: String }
    public struct Item: Decodable, Identifiable, Sendable {
        public let id: String
        public let zoneLabel: String?
        public let originalUrl: String
        public let managerVerified: Bool
        public let updatedAt: String
    }
    public let project: Project
    public let items: [Item]

    public func validatedItems(projectId: String) throws -> [Item] {
        guard project.id == projectId, UUID(uuidString: projectId) != nil, items.count <= 50 else {
            throw APIError(statusCode: 503, code: nil, message: "Invalid photo projection")
        }
        for item in items {
            guard UUID(uuidString: item.id) != nil, item.managerVerified,
                  item.originalUrl == "/api/v1/portal/projects/\(projectId)/evidence/\(item.id)/original" else {
                throw APIError(statusCode: 503, code: nil, message: "Invalid photo projection")
            }
        }
        return items
    }

    public static func originalRequestPath(projectId: String, evidenceId: String) throws -> String {
        guard UUID(uuidString: projectId) != nil, UUID(uuidString: evidenceId) != nil else {
            throw APIError(statusCode: 400, code: nil, message: "Invalid photo identifier")
        }
        return "portal/projects/\(projectId)/evidence/\(evidenceId)/original"
    }
}
