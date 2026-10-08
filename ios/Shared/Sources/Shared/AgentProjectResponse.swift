//
//  AgentProjectResponse.swift
//  Shared — typed DTOs for POST /api/v1/projects/:id/agent (Slice 01, no production UI).
//

import Foundation

public struct AgentProjectRequest: Encodable, Sendable {
    public let message: String

    public init(message: String) {
        self.message = message
    }
}

public struct AgentHealthDTO: Decodable, Sendable, Equatable {
    public let score: Double?
    public let band: String?
}

public struct AgentRiskDTO: Decodable, Sendable, Equatable {
    public let title: String
    public let why: String?
    public let severity: String?
}

public struct AgentBlockerDTO: Decodable, Sendable, Equatable {
    public let title: String
    public let why: String?
}

public struct AgentEvidenceDTO: Decodable, Sendable, Equatable {
    public let evidenceId: String
    public let type: String
    public let sourceEntityType: String?
    public let sourceEntityId: String?
}

public struct AgentProposedActionDTO: Decodable, Sendable, Equatable {
    public let actionType: String
    public let skillName: String?
    public let reason: String?
    public let expectedEffect: String?
}

public struct AgentProjectResponse: Decodable, Sendable {
    public let runId: String
    public let answer: String
    public let health: AgentHealthDTO?
    public let risks: [AgentRiskDTO]?
    public let blockers: [AgentBlockerDTO]?
    public let evidence: [AgentEvidenceDTO]?
    public let proposedActions: [AgentProposedActionDTO]?
    public let limitations: [String]?
    public let confidence: String?
    public let code: String?
    public let error: String?
}

public enum AgentProjectAPI {
    public static func path(projectId: String) -> String {
        "projects/\(projectId)/agent"
    }
}
