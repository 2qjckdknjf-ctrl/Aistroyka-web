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
    public let questions: [String]
    public let siteContext: String?
    public let requestedWorkType: String?
    public let locationLabel: String?
    public let desiredStart: String?
    public let desiredEnd: String?

    public init(
        id: String,
        title: String,
        description: String,
        status: String,
        projectId: String? = nil,
        updatedAt: String? = nil,
        mediaRefs: [CustomerIntakeMediaRef] = [],
        questions: [String] = [],
        siteContext: String? = nil,
        requestedWorkType: String? = nil,
        locationLabel: String? = nil,
        desiredStart: String? = nil,
        desiredEnd: String? = nil
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.projectId = projectId
        self.updatedAt = updatedAt
        self.mediaRefs = mediaRefs
        self.questions = questions
        self.siteContext = siteContext
        self.requestedWorkType = requestedWorkType
        self.locationLabel = locationLabel
        self.desiredStart = desiredStart
        self.desiredEnd = desiredEnd
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
        questions = try c.decodeIfPresent([String].self, forKey: .questions) ?? []
        siteContext = try c.decodeIfPresent(String.self, forKey: .siteContext)
        requestedWorkType = try c.decodeIfPresent(String.self, forKey: .requestedWorkType)
        if let location = try c.decodeIfPresent(LocationDTO.self, forKey: .location) {
            locationLabel = location.label
        } else {
            locationLabel = nil
        }
        desiredStart = try c.decodeIfPresent(String.self, forKey: .desiredStart)
        desiredEnd = try c.decodeIfPresent(String.self, forKey: .desiredEnd)
    }

    private struct LocationDTO: Decodable {
        let label: String?
    }

    private enum CodingKeys: String, CodingKey {
        case id, title, description, status, projectId, updatedAt, mediaRefs, questions
        case siteContext, requestedWorkType, location, desiredStart, desiredEnd
    }

    /// Validates optional YYYY-MM-DD desired date fields for portal intake create.
    public static func isISODate(_ value: String) -> Bool {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil else {
            return false
        }
        let parts = trimmed.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return false }
        let year = parts[0]
        let month = parts[1]
        let day = parts[2]
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        var comps = DateComponents()
        comps.calendar = calendar
        comps.timeZone = calendar.timeZone
        comps.year = year
        comps.month = month
        comps.day = day
        guard let date = calendar.date(from: comps) else { return false }
        let back = calendar.dateComponents([.year, .month, .day], from: date)
        return back.year == year && back.month == month && back.day == day
    }

    public static func decodeListJSON(_ data: Data) throws -> [CustomerIntakeDraft] {
        struct Envelope: Decodable { let data: [CustomerIntakeDraft] }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(Envelope.self, from: data).data
    }
}
