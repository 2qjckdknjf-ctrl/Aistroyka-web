//
//  HomeDashboardView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct HomeDashboardView: View {
    @State private var overview: OpsOverviewDTO?
    @State private var activationStatus: ActivationStatusDTO?
    @State private var helpHints: [HelpHintDTO] = []
    @State private var guideSummary: String?
    @State private var guideConfidence: Int?
    @State private var guideRiskSignals: [HelpAssistantRiskSignalDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && overview == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_dashboard", comment: ""))
                } else if let err = errorMessage, overview == nil {
                    ErrorStateView(message: err, retryTitle: NSLocalizedString("mgr_retry", comment: ""), retry: { load() })
                } else {
                    content
                }
            }
            .background(BrandTokens.bgPage)
            .navigationTitle(NSLocalizedString("mgr_nav_home", comment: ""))
            .brandScrollChrome()
            .refreshable { await loadAsync() }
            .onAppear { loadIfNeeded() }
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                BrandCard { managerStartGuidanceCard }
                if let kpis = overview?.kpis {
                    kpiSection(kpis)
                }
                if let queues = overview?.queues {
                    queuesSection(queues)
                }
            }
            .padding()
        }
    }

    private var managerStartGuidanceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(NSLocalizedString("mgr_start_title", comment: ""))
                .font(.headline)
            Text(
                String(
                    format: NSLocalizedString("mgr_start_progress_fmt", comment: ""),
                    completedLaunchSteps,
                    totalLaunchSteps
                )
            )
                .font(.subheadline)
                .foregroundStyle(BrandTokens.textSecondary)

            Text("\(launchDone(activationStatus?.getStarted?.createProject) ? "✓" : "○") \(NSLocalizedString("mgr_start_step_1", comment: ""))")
                .font(.subheadline)
            Text("\(launchDone(activationStatus?.getStarted?.inviteTeam) ? "✓" : "○") \(NSLocalizedString("mgr_start_step_2", comment: ""))")
                .font(.subheadline)
            Text("\(launchDone(activationStatus?.getStarted?.addTask) ? "✓" : "○") \(NSLocalizedString("mgr_start_step_3", comment: ""))")
                .font(.subheadline)

            Text(NSLocalizedString("mgr_ai_hints_title", comment: ""))
                .font(.subheadline)
                .fontWeight(.semibold)
                .padding(.top, 4)
            if let guideSummary, !guideSummary.isEmpty {
                Text(guideSummary)
                    .font(.caption)
                    .foregroundStyle(BrandTokens.textSecondary)
            }
            if let guideConfidence {
                Text(
                    String(
                        format: NSLocalizedString("mgr_ai_guide_confidence_fmt", comment: ""),
                        guideConfidence
                    )
                )
                .font(.caption)
            }
            if helpHints.isEmpty {
                Text("• \(NSLocalizedString("mgr_ai_hint_1", comment: ""))")
                    .font(.caption)
                    .foregroundStyle(BrandTokens.textSecondary)
                Text("• \(NSLocalizedString("mgr_ai_hint_2", comment: ""))")
                    .font(.caption)
                    .foregroundStyle(BrandTokens.textSecondary)
            } else {
                ForEach(Array(helpHints.prefix(2).enumerated()), id: \.offset) { _, hint in
                    Text("• \(hint.title)")
                        .font(.caption)
                    if !hint.reason.isEmpty {
                        Text(hint.reason)
                            .font(.caption2)
                            .foregroundStyle(BrandTokens.textSecondary)
                    }
                }
            }
            if !guideRiskSignals.isEmpty {
                Text(NSLocalizedString("mgr_ai_risk_signals_title", comment: ""))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .padding(.top, 2)
                ForEach(Array(guideRiskSignals.prefix(2).enumerated()), id: \.offset) { _, signal in
                    Text("• \(signal.title)")
                        .font(.caption)
                    Text(signal.detail)
                        .font(.caption2)
                        .foregroundStyle(BrandTokens.textSecondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func kpiSection(_ kpis: OpsOverviewDTO.OpsOverviewKpis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(NSLocalizedString("mgr_overview", comment: ""))
                .font(.headline)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                KPICard(title: NSLocalizedString("mgr_kpi_active_projects", comment: ""), value: "\(kpis.activeProjects ?? 0)")
                KPICard(title: NSLocalizedString("mgr_kpi_workers_today", comment: ""), value: "\(kpis.activeWorkersToday ?? 0)")
                KPICard(title: NSLocalizedString("mgr_kpi_reports_today", comment: ""), value: "\(kpis.reportsToday ?? 0)")
                KPICard(title: NSLocalizedString("mgr_kpi_overdue_tasks", comment: ""), value: "\(kpis.tasksOverdue ?? 0)")
                KPICard(title: NSLocalizedString("mgr_kpi_open_today", comment: ""), value: "\(kpis.tasksOpenToday ?? 0)")
                KPICard(title: NSLocalizedString("mgr_kpi_stuck_uploads", comment: ""), value: "\(kpis.stuckUploads ?? 0)")
            }
        }
    }

    private func queuesSection(_ queues: OpsOverviewDTO.OpsOverviewQueues) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(NSLocalizedString("mgr_needs_attention", comment: ""))
                .font(.headline)
            if let overdue = queues.tasksOverdue, !overdue.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text(NSLocalizedString("mgr_overdue_tasks", comment: ""))
                        .font(.subheadline)
                        .foregroundStyle(BrandTokens.textSecondary)
                    ForEach(Array(overdue.prefix(5)), id: \.id) { t in
                        NavigationLink(destination: TaskDetailManagerView(taskId: t.id ?? "")) {
                            Text(t.title ?? t.id ?? "")
                                .font(.caption)
                                .foregroundStyle(BrandTokens.textPrimary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(BrandTokens.space4)
                .background(BrandTokens.surface)
                .overlay(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous).stroke(BrandTokens.borderSubtle.opacity(0.8), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous))
            }
            if let openToday = queues.tasksOpenToday, !openToday.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text(NSLocalizedString("mgr_due_today", comment: ""))
                        .font(.subheadline)
                        .foregroundStyle(BrandTokens.textSecondary)
                    ForEach(Array(openToday.prefix(5)), id: \.id) { t in
                        NavigationLink(destination: TaskDetailManagerView(taskId: t.id ?? "")) {
                            Text(t.title ?? t.id ?? "")
                                .font(.caption)
                                .foregroundStyle(BrandTokens.textPrimary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(BrandTokens.space4)
                .background(BrandTokens.surface)
                .overlay(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous).stroke(BrandTokens.borderSubtle.opacity(0.8), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous))
            }
            if let pending = queues.reportsPendingReview, !pending.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text(NSLocalizedString("mgr_reports_pending", comment: ""))
                        .font(.subheadline)
                        .foregroundStyle(BrandTokens.textSecondary)
                    ForEach(Array(pending.prefix(5)), id: \.id) { r in
                        NavigationLink(destination: ReportDetailReviewView(reportId: r.id ?? "")) {
                            Text(r.id ?? "")
                                .font(.caption)
                                .foregroundStyle(BrandTokens.textPrimary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(BrandTokens.space4)
                .background(BrandTokens.surface)
                .overlay(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous).stroke(BrandTokens.borderSubtle.opacity(0.8), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: BrandTokens.radiusCard, style: .continuous))
            }
        }
    }

    private func load() {
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(item: overview, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(
            setLoading: { isLoading = $0 },
            setErrorMessage: { errorMessage = $0 }
        ) {
            overview = try await ManagerAPI.opsOverview()
            let activation = try? await ManagerAPI.activationStatus()
            activationStatus = activation
            if let getStarted = activation?.getStarted {
                helpHints = (try? await ManagerAPI.helpHints(
                    locale: supportedHelpLocale(),
                    role: "manager",
                    getStarted: getStarted
                )) ?? []
            } else {
                helpHints = []
            }
            let assistant = try? await ManagerAPI.helpAssistant(
                query: "",
                locale: supportedHelpLocale(),
                role: "manager",
                pathname: "/dashboard",
                activation: activation
            )
            await ManagerAPI.helpAssistantEvent(
                type: "open",
                locale: supportedHelpLocale(),
                role: "manager",
                pathname: "/dashboard"
            )
            guideSummary = assistant?.summary
            guideConfidence = assistant?.confidence
            guideRiskSignals = assistant?.riskSignals ?? []
        }
    }

    private var completedLaunchSteps: Int {
        [
            activationStatus?.getStarted?.createProject,
            activationStatus?.getStarted?.inviteTeam,
            activationStatus?.getStarted?.addTask,
            activationStatus?.getStarted?.uploadReport,
            activationStatus?.getStarted?.viewAi,
        ].filter { $0 == true }.count
    }

    private var totalLaunchSteps: Int { 5 }

    private func launchDone(_ value: Bool?) -> Bool { value == true }

    private func supportedHelpLocale() -> String {
        let preferred = Locale.preferredLanguages.first ?? "en"
        let language = String(preferred.prefix(2)).lowercased()
        return ["ru", "es", "it"].contains(language) ? language : "en"
    }
}
