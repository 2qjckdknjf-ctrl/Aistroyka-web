//
//  AiFeedbackSubmit.swift
//  Shared — optional POST /api/v1/ai/feedback (Phase D + flywheel preference fields).
//

import Foundation

public struct AiFeedbackSubmitRequest: Encodable {
    public let runId: String
    public let sourceKind: String
    public let feedbackCategory: String
    public let reviewerRole: String?
    public let usefulnessScore: Int?
    public let comments: String?
    public let aiRequestId: String?
    public let taskType: String?
    public let audience: String?
    public let inputContext: [String: String]?
    public let rejectedOutput: [String: String]?
    public let chosenOutput: [String: String]?

    public init(
        runId: String,
        sourceKind: String = "human",
        feedbackCategory: String = "usefulness",
        reviewerRole: String? = "manager",
        usefulnessScore: Int? = nil,
        comments: String? = nil,
        aiRequestId: String? = nil,
        taskType: String? = nil,
        audience: String? = nil,
        inputContext: [String: String]? = nil,
        rejectedOutput: [String: String]? = nil,
        chosenOutput: [String: String]? = nil
    ) {
        self.runId = runId
        self.sourceKind = sourceKind
        self.feedbackCategory = feedbackCategory
        self.reviewerRole = reviewerRole
        self.usefulnessScore = usefulnessScore
        self.comments = comments
        self.aiRequestId = aiRequestId
        self.taskType = taskType
        self.audience = audience
        self.inputContext = inputContext
        self.rejectedOutput = rejectedOutput
        self.chosenOutput = chosenOutput
    }
}

private struct AiFeedbackSubmitResponse: Decodable {
    struct DataPayload: Decodable { let feedbackId: String? }
    let data: DataPayload?
    let error: String?
}

public enum AiFeedbackSubmit {
    /// Build preference-pair fields when correction text is present; nil otherwise.
    public static func preferenceFields(
        runId: String,
        assistantText: String,
        correctionText: String,
        userQuestion: String?
    ) -> (taskType: String, rejectedOutput: [String: String], chosenOutput: [String: String], inputContext: [String: String])? {
        let trimmed = correctionText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        var ctx: [String: String] = [:]
        if let q = userQuestion?.trimmingCharacters(in: .whitespacesAndNewlines), !q.isEmpty {
            ctx["question"] = q
        }
        return (
            taskType: "copilot",
            rejectedOutput: ["text": assistantText],
            chosenOutput: ["text": trimmed],
            inputContext: ctx
        )
    }

    public static func submit(_ body: AiFeedbackSubmitRequest) async throws {
        let _: AiFeedbackSubmitResponse = try await APIClient.shared.request(
            path: "/api/v1/ai/feedback",
            method: "POST",
            body: body
        )
    }
}
