//
//  AIRiskDetailView.swift
//  AiStroykaManager
//

import SwiftUI
import UIKit
import Shared

struct AIRiskDetailView: View {
    let risk: ManagerAIRiskItem
    @EnvironmentObject var sessionState: ManagerSessionState
    @EnvironmentObject var router: ManagerTabRouter
    @State private var decision: ManagerRiskDecision?
    @State private var comment = ""
    @State private var isSaving = false
    @State private var savedLine: String?
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_high_risk", comment: ""), kind: .danger)
                    ManagerV43StatusPill(text: risk.projectName, kind: .neutral)
                    Spacer()
                }
                HStack(alignment: .top) {
                    Text(risk.summary)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(ManagerV43.textPrimary)
                    Spacer()
                    ManagerProgressRing(progress: Double(risk.confidence) / 100, size: 84, tint: ManagerV43.aiViolet)
                }
                HStack {
                    metric(NSLocalizedString("mgr_v43_probability", comment: ""), "\(risk.probability)%", ManagerV43.danger)
                    metric(NSLocalizedString("mgr_due", comment: ""), "+\(risk.delayDays)", ManagerV43.warning)
                    metric(NSLocalizedString("mgr_v43_project_budget", comment: ""), budget, ManagerV43.yellow)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(NSLocalizedString("mgr_v43_why_ai", comment: ""))
                        .font(.headline)
                        .foregroundStyle(ManagerV43.textPrimary)
                    Text(risk.recommendation)
                        .font(.subheadline)
                        .foregroundStyle(ManagerV43.textSecondary)
                }

                ManagerV43Card(borderColor: ManagerV43.aiViolet.opacity(0.5)) {
                    HStack {
                        ManagerAIBadge(size: 28)
                        Text(risk.recommendation)
                            .font(.subheadline)
                            .foregroundStyle(ManagerV43.textPrimary)
                    }
                    HStack {
                        ManagerV43StatusPill(text: NSLocalizedString("mgr_v43_risk_down", comment: ""), kind: .success)
                        if let budgetImpact = risk.budgetImpact {
                            ManagerV43StatusPill(text: ManagerV43Formatters.compactCurrency(budgetImpact, currencyCode: "RUB"), kind: .ai)
                        }
                    }
                }

                Text(NSLocalizedString("mgr_v43_manager_decision", comment: ""))
                    .font(.headline)
                    .foregroundStyle(ManagerV43.textPrimary)
                decisionCard(.accept, ManagerV43.success)
                decisionCard(.assign, ManagerV43.dataBlue)
                decisionCard(.reject, ManagerV43.danger)

                TextField(NSLocalizedString("mgr_v43_decision_comment", comment: ""), text: $comment, axis: .vertical)
                    .lineLimit(2...4)
                    .padding(12)
                    .background(ManagerV43.card)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(ManagerV43.border, lineWidth: 1))
                    .foregroundStyle(ManagerV43.textPrimary)

                if let errorMessage {
                    Text(errorMessage).font(.caption).foregroundStyle(ManagerV43.danger)
                }
                if let savedLine {
                    Text(savedLine).font(.caption2).foregroundStyle(ManagerV43.success)
                }

                ManagerV43PrimaryButton(
                    title: NSLocalizedString("mgr_v43_record_decision", comment: ""),
                    enabled: decision != nil && !isSaving,
                    loading: isSaving,
                    action: save
                )
                .accessibilityIdentifier("pilot_manager_record_decision")
                HStack {
                    Image(systemName: "checkmark.shield")
                    Text(NSLocalizedString("mgr_v43_ai_disclaimer", comment: ""))
                }
                .font(.caption)
                .foregroundStyle(ManagerV43.textSecondary)
            }
            .padding(ManagerV43.screenX)
        }
        .background(ManagerV43.bg.ignoresSafeArea())
        .navigationTitle(NSLocalizedString("mgr_v43_supply_risk", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadExistingDecision() }
        .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.decisionsChanged)) { _ in
            Task { await loadExistingDecision() }
        }
    }

    private func loadExistingDecision() async {
        guard sessionState.isLoggedIn, !ManagerV43Preview.showsCatalogWithoutAuth else { return }
        guard let rows = try? await ManagerAPI.riskDecisions(jobId: risk.id), let latest = rows.first else { return }
        if decision == nil, let stored = ManagerRiskDecision(rawValue: latest.decision ?? "") {
            decision = stored
        }
        if comment.isEmpty, let storedComment = latest.comment, !storedComment.isEmpty {
            comment = storedComment
        }
        if savedLine == nil {
            savedLine = ManagerV43Formatters.riskDecisionAuditLine(
                actor: latest.actor ?? "manager",
                decision: latest.decision ?? "",
                comment: latest.comment ?? "",
                source: "server",
                at: ManagerV43Formatters.parseISODate(latest.createdAt) ?? Date()
            )
        }
    }

    private var budget: String {
        guard let value = risk.budgetImpact else { return "—" }
        return ManagerV43Formatters.compactCurrency(value, currencyCode: "RUB")
    }

    private func metric(_ title: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption2).foregroundStyle(ManagerV43.textSecondary)
            Text(value).font(.caption.weight(.semibold)).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(8)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func decisionCard(_ value: ManagerRiskDecision, _ color: Color) -> some View {
        Button { decision = value } label: {
            HStack {
                Image(systemName: value == .accept ? "checkmark.circle" : value == .assign ? "person.crop.circle" : "xmark.circle")
                    .foregroundStyle(color)
                VStack(alignment: .leading) {
                    Text(NSLocalizedString(value.labelKey, comment: ""))
                        .foregroundStyle(ManagerV43.textPrimary)
                    Text(value == .accept ? NSLocalizedString("mgr_v43_ai_recommended", comment: "") : "")
                        .font(.caption)
                        .foregroundStyle(ManagerV43.textSecondary)
                }
                Spacer()
            }
            .padding(14)
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(decision == value ? color : ManagerV43.border, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("pilot_manager_risk_decision_\(value.rawValue)")
        .accessibilityAddTraits(decision == value ? .isSelected : [])
    }

    private func save() {
        guard let decision else { return }
        Task {
            let success = await runManagerAction(
                setLoading: { isSaving = $0 },
                setErrorMessage: { errorMessage = $0 }
            ) {
                let actor = sessionState.isLoggedIn ? "manager" : "unknown"
                let event = ManagerRiskAuditEvent(
                    id: UUID().uuidString,
                    riskId: risk.id,
                    decision: decision,
                    comment: comment,
                    actor: actor,
                    source: "ios-manager-v4.3",
                    createdAt: Date()
                )
                if sessionState.isLoggedIn && !ManagerV43Preview.showsCatalogWithoutAuth {
                    try await ManagerAPI.submitRiskDecision(
                        jobId: risk.id,
                        decision: decision.rawValue,
                        comment: comment.isEmpty ? nil : comment,
                        title: risk.title
                    )
                } else {
                    ManagerRiskAuditStore.append(event)
                }
                savedLine = ManagerV43Formatters.riskDecisionAuditLine(
                    actor: actor,
                    decision: decision.rawValue,
                    comment: comment,
                    source: event.source,
                    at: event.createdAt
                )
                ManagerLiveSync.post(ManagerLiveSync.decisionsChanged)
            }
            if success {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                if decision == .assign {
                    router.openNewTask()
                }
            }
        }
    }
}
