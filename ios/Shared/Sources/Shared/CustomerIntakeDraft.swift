import Foundation

/// Customer-safe media reference for intake drafts (https URL and/or opaque media_id).
public struct CustomerIntakeMediaRef: Equatable, Sendable {
    public let kind: String
    public let url: String?
    public let mediaId: String?

    public init(kind: String, url: String? = nil, mediaId: String? = nil) {
        self.kind = kind
        self.url = url
        self.mediaId = mediaId
    }
}

extension CustomerIntakeMediaRef: Codable {
    private enum CodingKeys: String, CodingKey {
        case kind
        case url
        case mediaId
        case media_id
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        kind = try c.decode(String.self, forKey: .kind)
        url = try c.decodeIfPresent(String.self, forKey: .url)
        if let id = try c.decodeIfPresent(String.self, forKey: .mediaId) {
            mediaId = id
        } else {
            mediaId = try c.decodeIfPresent(String.self, forKey: .media_id)
        }
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(kind, forKey: .kind)
        try c.encodeIfPresent(url, forKey: .url)
        try c.encodeIfPresent(mediaId, forKey: .media_id)
    }
}

/// Customer-safe GET/POST /api/v1/portal/intake draft row under convertFromSnakeCase.
/// AI scope proposals must remain draft/proposed — not contractual truth.
public struct CustomerIntakeDraft: Decodable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let description: String
    public let status: String
    public let projectId: String?
    public let updatedAt: String?
    public let mediaRefs: [CustomerIntakeMediaRef]

    public init(
        id: String,
        title: String,
        description: String,
        status: String,
        projectId: String? = nil,
        updatedAt: String? = nil,
        mediaRefs: [CustomerIntakeMediaRef] = []
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.projectId = projectId
        self.updatedAt = updatedAt
        self.mediaRefs = mediaRefs
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        description = try c.decode(String.self, forKey: .description)
        status = try c.decode(String.self, forKey: .status)
        projectId = try c.decodeIfPresent(String.self, forKey: .projectId)
        updatedAt = try c.decodeIfPresent(String.self, forKey: .updatedAt)
        mediaRefs = try c.decodeIfPresent([CustomerIntakeMediaRef].self, forKey: .mediaRefs) ?? []
    }

    private enum CodingKeys: String, CodingKey {
        case id, title, description, status, projectId, updatedAt, mediaRefs
    }

    public static func decodeListJSON(_ data: Data) throws -> [CustomerIntakeDraft] {
        struct Envelope: Decodable { let data: [CustomerIntakeDraft] }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(Envelope.self, from: data).data
    }
}
