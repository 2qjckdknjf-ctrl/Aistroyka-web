import Foundation

/// Customer/Manager-safe projection of GET /api/v1/projects/:id/graph?view=ai_context
/// Overlay source refs only — not contractual truth and not finance SOT.
public struct ConstructionGraphAIContext: Decodable, Sendable {
    public let projectId: String
    public let tenantId: String
    public let truncated: Bool
    public let summary: Summary
    public let nodes: [Node]
    public let edges: [Edge]
    public let disclaimer: String

    public struct Summary: Decodable, Sendable {
        public let nodeCount: Int
        public let edgeCount: Int
        public let families: [String: Int]
    }

    public struct Node: Decodable, Identifiable, Sendable {
        public let id: String
        public let family: String
        public let label: String
        public let source: SourceRef
        public let provenance: Provenance
    }

    public struct Edge: Decodable, Identifiable, Sendable {
        public let id: String
        public let kind: String
        public let fromId: String
        public let toId: String
        public let provenance: EdgeProvenance
    }

    public struct SourceRef: Decodable, Sendable {
        public let table: String
        public let id: String
    }

    public struct Provenance: Decodable, Sendable {
        public let kind: String
        public let table: String
        public let id: String
    }

    public struct EdgeProvenance: Decodable, Sendable {
        public let kind: String
        public let table: String
        public let column: String
    }

    public static func decodeEnvelopeJSON(_ data: Data) throws -> ConstructionGraphAIContext {
        struct Envelope: Decodable { let data: ConstructionGraphAIContext }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(Envelope.self, from: data).data
    }
}
