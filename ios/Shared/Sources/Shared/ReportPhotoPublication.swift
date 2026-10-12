import Foundation

public enum ReportPhotoPublication {
    public struct State: Decodable, Sendable {
        public let reportId: String
        public let projectId: String
        public let reportStatus: String
        public let portalEnabled: Bool
        public let items: [Item]

        public func validated(reportId expected: String) throws -> State {
            guard let expectedId = UUID(uuidString: expected), UUID(uuidString: reportId) == expectedId,
                  UUID(uuidString: projectId) != nil, items.count <= 100,
                  Set(items.map(\.attachmentId)).count == items.count else { throw invalid() }
            for item in items {
                guard UUID(uuidString: item.attachmentId) != nil,
                      item.mediaId.map({ UUID(uuidString: $0) != nil }) ?? true,
                      item.uploadSessionId.map({ UUID(uuidString: $0) != nil }) ?? true,
                      item.evidenceId.map({ UUID(uuidString: $0) != nil }) ?? true,
                      item.version.map({ !$0.isEmpty && $0.count <= 64 }) ?? true,
                      !item.published || (item.evidenceId != nil && item.version != nil),
                      !item.sharingEnabled || (item.published && item.eligible && portalEnabled && reportStatus == "approved")
                else { throw invalid() }
            }
            return self
        }

        public func selected(mediaId: String?, uploadSessionId: String?) -> Item? {
            guard mediaId != nil || uploadSessionId != nil else { return nil }
            return items.first { $0.mediaId == mediaId && $0.uploadSessionId == uploadSessionId }
        }
    }
    public struct Item: Decodable, Identifiable, Sendable {
        public let attachmentId: String
        public let mediaId: String?
        public let uploadSessionId: String?
        public let published: Bool
        public let sharingEnabled: Bool
        public let eligible: Bool
        public let evidenceId: String?
        public let version: String?
        public var id: String { attachmentId }
    }
    public struct Response: Decodable { public let data: State }
    public struct WriteResponse: Decodable { public let data: Item }
    public struct Action: Encodable, Sendable {
        public let attachmentId: String
        public let visible: Bool
        public let expectedVersion: String?
        public init(attachmentId: String, visible: Bool, expectedVersion: String?) throws {
            guard UUID(uuidString: attachmentId) != nil,
                  expectedVersion.map({ !$0.isEmpty && $0.count <= 64 }) ?? true else { throw invalid() }
            self.attachmentId = attachmentId; self.visible = visible; self.expectedVersion = expectedVersion
        }
        private enum CodingKeys: String, CodingKey { case attachmentId = "attachment_id", visible, expectedVersion = "expected_version" }
        public func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: CodingKeys.self)
            try c.encode(attachmentId, forKey: .attachmentId); try c.encode(visible, forKey: .visible)
            if let expectedVersion { try c.encode(expectedVersion, forKey: .expectedVersion) }
            else { try c.encodeNil(forKey: .expectedVersion) }
        }
    }
    public static func requestPath(reportId: String) throws -> String {
        guard UUID(uuidString: reportId) != nil else { throw invalid() }
        return "reports/\(reportId)/publication"
    }
    private static func invalid() -> APIError { APIError(statusCode: 400, code: nil, message: "Invalid publication contract") }
}
