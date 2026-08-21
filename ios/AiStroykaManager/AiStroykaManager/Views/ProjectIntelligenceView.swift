//
//  ProjectIntelligenceView.swift
//  GET /api/v1/projects/:id/intelligence
//

import SwiftUI
import Shared

struct ProjectIntelligenceView: View {
    let projectId: String
    let projectName: String

    @State private var data: ProjectIntelligenceDataDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading && data == nil && errorMessage == nil {
                LoadingStateView(message: NSLocalizedString("mgr_loading_intelligence", comment: ""))
            } else if let err = errorMessage, data == nil {
                ErrorStateView(message: err, retry: { load() })
            } else if let d = data {
                intelligenceList(d)
            }
        }
        .aistroykaPageBackground(ManagerSemanticColors.pageBackground)
        .navigationTitle(NSLocalizedString("mgr_intelligence_title", comment: ""))
        .accessibilityIdentifier("pilot_manager_intelligence")
        .refreshable { await loadAsync() }
        .onAppear { loadIfNeeded() }
    }

    @ViewBuilder
    private func intelligenceList(_ d: ProjectIntelligenceDataDTO) -> some View {
        List {
            if let op = d.operational {
                Section(NSLocalizedString("mgr_intelligence_trust_section", comment: "")) {
                    if let s = op.trustSummary { Text(s).font(.subheadline) }
                    if let band = op.trustBand {
                        LabeledContent(NSLocalizedString("mgr_intelligence_trust_band", comment: ""), value: band)
                    }
                }
            }
            if let exec = d.executiveProjectSummary {
                Section(NSLocalizedString("mgr_intelligence_summary_section", comment: "")) {
                    if let h = exec.headline { Text(h).font(.headline) }
                    if let s = exec.summary { Text(s).font(.subheadline) }
                    if let score = exec.healthScore {
                        LabeledContent(NSLocalizedString("mgr_intelligence_health_score", comment: ""), value: String(format: "%.0f", score))
                    }
                }
            }
            if let risks = d.topRiskInsights, !risks.isEmpty {
                Section(NSLocalizedString("mgr_intelligence_risks_section", comment: "")) {
                    ForEach(Array(risks.enumerated()), id: \.offset) { _, r in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(r.title ?? "—").font(.subheadline.weight(.semibold))
                            if let ex = r.explanation, !ex.isEmpty { Text(ex).font(.caption).foregroundStyle(.secondary) }
                            if let act = r.recommendedAction, !act.isEmpty {
                                Text(act).font(.caption).foregroundStyle(.tertiary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
            if let hints = d.operational?.nextStepHints, !hints.isEmpty {
                Section(NSLocalizedString("mgr_intelligence_next_steps", comment: "")) {
                    ForEach(hints, id: \.self) { Text($0).font(.subheadline) }
                }
            }
            Section {
                NavigationLink(destination: ProjectCopilotChatView(
                    projectId: projectId,
                    projectName: projectName,
                    intelligence: d
                )) {
                    Label(NSLocalizedString("mgr_open_copilot", comment: ""), systemImage: "bubble.left.and.bubble.right")
                }
                .accessibilityIdentifier("pilot_manager_open_copilot")
            }
        }
        .aistroykaListChrome(
            pageBackground: ManagerSemanticColors.pageBackground,
            surfaceMuted: ManagerSemanticColors.surfaceMuted
        )
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(item: data, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            data = try await ManagerCopilotService.projectIntelligence(projectId: projectId)
        }
    }
}
