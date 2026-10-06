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

    /// GET /api/v1/portal/intake, optionally scoped by the portal project the customer is viewing.
    public static func portalIntakeListPath(projectId: String?) -> String {
        guard let query = projectIdQuery(projectId) else { return "portal/intake" }
        return "portal/intake?\(query)"
    }

    /// POST /api/v1/portal/intake/:id/submit. project_id lets a multi-tenant stakeholder resolve the draft tenant.
    public static func portalIntakeSubmitPath(draftId: String, projectId: String?) -> String {
        let id = percentEncode(draftId)
        guard let query = projectIdQuery(projectId) else { return "portal/intake/\(id)/submit" }
        return "portal/intake/\(id)/submit?\(query)"
    }

    private static func projectIdQuery(_ projectId: String?) -> String? {
        guard let projectId else { return nil }
        let trimmed = projectId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return "project_id=\(percentEncode(trimmed))"
    }

    private static func percentEncode(_ value: String) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        return value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value
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

    /// Overlay a single optional https URL onto stored refs without dropping media_id-only or extra items.
    public static func mergeEditedMediaURL(
        existing: [CustomerIntakeMediaRef],
        editedURL: String
    ) -> [CustomerIntakeMediaRef] {
        let trimmed = editedURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let originalFirstURL = existing.first?.url ?? ""
        guard trimmed != originalFirstURL else { return existing }
        var refs = existing
        if trimmed.isEmpty {
            guard !refs.isEmpty else { return refs }
            let first = refs[0]
            if first.mediaId == nil {
                refs.removeFirst()
            } else {
                refs[0] = CustomerIntakeMediaRef(kind: first.kind, url: nil, mediaId: first.mediaId)
            }
            return refs
        }
        if refs.isEmpty {
            return [CustomerIntakeMediaRef(kind: "image", url: trimmed)]
        }
        let first = refs[0]
        refs[0] = CustomerIntakeMediaRef(kind: first.kind, url: trimmed, mediaId: first.mediaId)
        return refs
    }
}

/// PATCH /api/v1/portal/intake/:id body. Nil optionals encode as JSON null so clears persist.
public struct CustomerIntakeDraftPatch: Encodable, Sendable {
    public var title: String
    public var description: String
    public var mediaRefs: [CustomerIntakeMediaRef]
    public var questions: [String]
    public var siteContext: String?
    public var requestedWorkType: String?
    public var locationLabel: String?
    public var desiredStart: String?
    public var desiredEnd: String?
    public var projectId: String?

    public init(
        title: String,
        description: String,
        mediaRefs: [CustomerIntakeMediaRef],
        questions: [String],
        siteContext: String?,
        requestedWorkType: String?,
        locationLabel: String?,
        desiredStart: String?,
        desiredEnd: String?,
        projectId: String?
    ) {
        self.title = title
        self.description = description
        self.mediaRefs = mediaRefs
        self.questions = questions
        self.siteContext = siteContext
        self.requestedWorkType = requestedWorkType
        self.locationLabel = locationLabel
        self.desiredStart = desiredStart
        self.desiredEnd = desiredEnd
        self.projectId = projectId
    }

    private enum CodingKeys: String, CodingKey {
        case title, description, questions, location
        case mediaRefs = "media_refs"
        case siteContext = "site_context"
        case requestedWorkType = "requested_work_type"
        case desiredStart = "desired_start"
        case desiredEnd = "desired_end"
        case projectId = "project_id"
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(title, forKey: .title)
        try c.encode(description, forKey: .description)
        try c.encode(mediaRefs, forKey: .mediaRefs)
        try c.encode(questions, forKey: .questions)
        if let siteContext {
            try c.encode(siteContext, forKey: .siteContext)
        } else {
            try c.encodeNil(forKey: .siteContext)
        }
        if let requestedWorkType {
            try c.encode(requestedWorkType, forKey: .requestedWorkType)
        } else {
            try c.encodeNil(forKey: .requestedWorkType)
        }
        if let locationLabel, !locationLabel.isEmpty {
            try c.encode(["precision": "city", "label": locationLabel], forKey: .location)
        } else {
            try c.encodeNil(forKey: .location)
        }
        if let desiredStart {
            try c.encode(desiredStart, forKey: .desiredStart)
        } else {
            try c.encodeNil(forKey: .desiredStart)
        }
        if let desiredEnd {
            try c.encode(desiredEnd, forKey: .desiredEnd)
        } else {
            try c.encodeNil(forKey: .desiredEnd)
        }
        if let projectId {
            try c.encode(projectId, forKey: .projectId)
        }
    }
}
