//
//  ManagerIntelligenceModels.swift
//  DTOs for GET /api/v1/projects/:id/intelligence (camelCase JSON).
//

import Foundation

struct ProjectIntelligenceResponse: Decodable {
    let data: ProjectIntelligenceDataDTO?
}

struct ProjectIntelligenceDataDTO: Decodable {
    let executiveProjectSummary: ExecutiveProjectSummaryDTO?
    let projectHealthScore: ProjectHealthScoreDTO?
    let riskOverview: RiskOverviewDTO?
    let topRiskInsights: [TopRiskInsightDTO]?
    let missingEvidenceInsights: [MissingEvidenceInsightDTO]?
    let recommendations: [IntelligenceRecommendationDTO]?
    let operational: ManagerOperationalDTO?
}

struct ExecutiveProjectSummaryDTO: Decodable {
    let headline: String?
    let summary: String?
    let healthLabel: String?
    let healthScore: Double?
    let recommendedActions: [String]?
    let dataSufficiency: String?
    let missingDataDisclaimer: String?
}

struct ProjectHealthScoreDTO: Decodable {
    let score: Double?
    let label: String?
    let confidence: String?
    let missingDataDisclaimer: String?
}

struct RiskOverviewDTO: Decodable {
    let high: Int?
    let medium: Int?
    let low: Int?
}

struct TopRiskInsightDTO: Decodable {
    let title: String?
    let description: String?
    let severity: String?
    let recommendedAction: String?
    let explanation: String?
}

struct MissingEvidenceInsightDTO: Decodable {
    let title: String?
    let recommendedAction: String?
}

struct IntelligenceRecommendationDTO: Decodable {
    let title: String?
    let description: String?
}

struct ManagerOperationalDTO: Decodable {
    let state: String?
    let trustBand: String?
    let trustSummary: String?
    let disclaimers: [String]?
    let whyBullets: [String]?
    let nextStepHints: [String]?
    let requestId: String?

    enum CodingKeys: String, CodingKey {
        case state
        case trustBand = "trust_band"
        case trustSummary = "trust_summary"
        case disclaimers
        case whyBullets = "why_bullets"
        case nextStepHints = "next_step_hints"
        case requestId = "request_id"
    }
}

// MARK: - Copilot stream (POST body)

struct DecisionContextPayload: Encodable {
    let overallRisk: Double
    let confidence: Double
    let topRiskFactors: [DecisionRiskFactor]
    let projectedDelayDate: String?
    let velocityTrend: String
    let anomalies: [String]
    let aggregatedAt: String

    enum CodingKeys: String, CodingKey {
        case overallRisk = "overall_risk"
        case confidence
        case topRiskFactors = "top_risk_factors"
        case projectedDelayDate = "projected_delay_date"
        case velocityTrend = "velocity_trend"
        case anomalies
        case aggregatedAt = "aggregated_at"
    }
}

struct DecisionRiskFactor: Encodable {
    let name: String
    let score: Double
    let weight: Double
}

struct CopilotStreamRequestBody: Encodable {
    let threadId: String?
    let userText: String
    let decisionContext: DecisionContextPayload
    let locale: String?

    enum CodingKeys: String, CodingKey {
        case threadId = "thread_id"
        case userText = "user_text"
        case decisionContext = "decision_context"
        case locale
    }
}

extension ProjectIntelligenceDataDTO {
    func buildDecisionContext() -> DecisionContextPayload {
        let score = projectHealthScore?.score ?? executiveProjectSummary?.healthScore ?? 50
        let overallRisk = min(1, max(0, 1 - score / 100))
        let conf: Double = {
            switch projectHealthScore?.confidence?.lowercased() {
            case "high": return 0.85
            case "medium": return 0.6
            case "low": return 0.35
            default: return 0.7
            }
        }()
        let factors = (topRiskInsights ?? []).prefix(5).map { insight in
            let sev: Double = insight.severity == "high" ? 0.9 : insight.severity == "medium" ? 0.6 : 0.35
            return DecisionRiskFactor(name: insight.title ?? "risk", score: sev, weight: 1)
        }
        return DecisionContextPayload(
            overallRisk: overallRisk,
            confidence: conf,
            topRiskFactors: Array(factors),
            projectedDelayDate: nil,
            velocityTrend: "unknown",
            anomalies: [],
            aggregatedAt: ISO8601DateFormatter().string(from: Date())
        )
    }
}
