import Foundation

/// Customer-safe GET/POST /api/v1/portal/intake draft row under convertFromSnakeCase.
/// AI scope proposals must remain draft/proposed — not contractual truth.
public struct CustomerIntakeDraft: Decodable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let description: String
    public let status: String
    public let projectId: String?
    public let updatedAt: String?

    public static func decodeListJSON(_ data: Data) throws -> [CustomerIntakeDraft] {
        struct Envelope: Decodable { let data: [CustomerIntakeDraft] }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(Envelope.self, from: data).data
    }
}
