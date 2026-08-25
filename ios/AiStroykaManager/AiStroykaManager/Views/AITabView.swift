//
//  AITabView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct AITabView: View {
    @EnvironmentObject var router: ManagerTabRouter
    @State private var jobs: [AIJobDTO] = []
    @State private var projects: [ProjectDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @StateObject private var networkMonitor = NetworkMonitor.shared
    @State private var lastSync: Date?
    @State private var deepLinkRisk: ManagerAIRiskItem?
    @State private var reportProjectNames: [String: String] = [:]

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && jobs.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_ai_jobs", comment: ""))
                } else if let err = errorMessage, jobs.isEmpty && risks.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else {
                    content
                }
            }
            .accessibilityIdentifier("pilot_manager_ai_center")
            .background(ManagerV43.bg.ignoresSafeArea())
            .navigationTitle(NSLocalizedString("mgr_v43_ai_center", comment: ""))
            .refreshable { await loadAsync() }
            .onAppear {
                loadIfNeeded()
                openPendingRisk(router.pendingRiskId)
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.appBecameActive)) { _ in
                load()
            }
            .onReceive(NotificationCenter.default.publisher(for: ManagerLiveSync.decisionsChanged)) { _ in
                load()
            }
            .onChange(of: router.pendingRiskId) { id in
                openPendingRisk(id)
            }
            .navigationDestination(isPresented: Binding(
                get: { deepLinkRisk != nil },
                set: { if !$0 { deepLinkRisk = nil } }
            )) {
                if let risk = deepLinkRisk {
                    AIRiskDetailView(risk: risk)
                }
            }
        }
    }

    private var risks: [ManagerAIRiskItem] {
        let live: [ManagerAIRiskItem] = jobs.prefix(8).compactMap { job in
            guard let id = job.id ?? job.entity else { return nil }
            return ManagerAIRiskItem(
                id: id,
                title: localizedJobTitle(job.type),
                projectName: projectName(for: job),
                severity: (job.status ?? "").contains("fail") ? "high" : "medium",
                probability: 50,
                delayDays: 0,
                budgetImpact: nil,
                confidence: 70,
                summary: job.lastError ?? job.entity ?? job.type ?? "",
                recommendation: NSLocalizedString("mgr_v43_ai_disclaimer", comment: ""),
                jobStatus: job.status
            )
        }
        if live.isEmpty && ManagerV43Preview.isEnabled {
            return ManagerDemoCatalog.risks(projectName: projects.first?.name ?? ManagerDemoCatalog.featuredProjectName)
        }
        return live
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if !networkMonitor.isConnected {
                    ManagerV43OfflineBanner(lastSync: lastSync, retry: { load() })
                }
                HStack {
                    kpi("\(jobs.count)", NSLocalizedString("mgr_v43_under_watch", comment: ""), ManagerV43.textPrimary)
                    kpi("\(risks.filter { $0.severity == "high" }.count)", NSLocalizedString("mgr_v43_high_risk", comment: ""), ManagerV43.danger)
                    kpi(
                        ManagerV43Preview.isEnabled ? "81%" : "—",
                        NSLocalizedString("mgr_v43_on_time", comment: ""),
                        ManagerV43.success
                    )
                }
                if let top = risks.first {
                    NavigationLink(destination: AIRiskDetailView(risk: top)) {
                        ManagerV43Card(borderColor: ManagerV43.aiViolet.opacity(0.6)) {
                            HStack(alignment: .top, spacing: 12) {
                                if ManagerV43Preview.isEnabled {
                                    Image("DemoSiteNight")
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 56, height: 56)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(top.title)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundStyle(ManagerV43.textPrimary)
                                        .lineLimit(2)
                                    Text(top.summary)
                                        .font(.caption)
                                        .foregroundStyle(ManagerV43.textSecondary)
                                        .lineLimit(3)
                                }
                                Spacer(minLength: 8)
                                ManagerProgressRing(progress: Double(top.confidence) / 100, size: 56, tint: ManagerV43.aiViolet)
                            }
                            Text(NSLocalizedString("mgr_v43_open_solution", comment: ""))
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 40)
                                .background(ManagerV43.aiViolet)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }
                    .buttonStyle(.plain)
                }
                Text(NSLocalizedString("mgr_v43_key_risks", comment: ""))
                    .font(.headline)
                    .foregroundStyle(ManagerV43.textPrimary)
                if risks.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_v43_key_risks", comment: ""),
                        subtitle: NSLocalizedString("mgr_v43_ai_fallback", comment: "")
                    )
                    .frame(minHeight: 140)
                }
                ForEach(risks) { risk in
                    NavigationLink(destination: AIRiskDetailView(risk: risk)) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(risk.severity == "high" ? ManagerV43.danger : ManagerV43.warning)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(risk.title).foregroundStyle(ManagerV43.textPrimary).lineLimit(2)
                                Text(risk.projectName).font(.caption).foregroundStyle(ManagerV43.textSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").foregroundStyle(ManagerV43.textSecondary)
                        }
                        .padding(12)
                        .background(ManagerV43.card)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("pilot_manager_ai_risk_\(risk.id)")
                }
                Text(NSLocalizedString("mgr_v43_ai_disclaimer", comment: ""))
                    .font(.caption)
                    .foregroundStyle(ManagerV43.textSecondary)
            }
            .padding(ManagerV43.screenX)
        }
    }

    private func kpi(_ value: String, _ title: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value).font(.headline).foregroundStyle(color)
            Text(title).font(.caption2).foregroundStyle(ManagerV43.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(ManagerV43.card)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func localizedJobTitle(_ type: String?) -> String {
        guard let type, !type.isEmpty else {
            return NSLocalizedString("mgr_v43_ai_job", comment: "")
        }
        let key = "mgr_v43_ai_job_\(type)"
        let localized = NSLocalizedString(key, comment: "")
        if localized != key { return localized }
        return type.contains("_") ? NSLocalizedString("mgr_v43_ai_job", comment: "") : type
    }

    private func projectName(for job: AIJobDTO) -> String {
        if let entity = job.entity, let name = reportProjectNames[entity], !name.isEmpty {
            return name
        }
        return projects.first?.name ?? "—"
    }

    @MainActor
    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func openPendingRisk(_ id: String?) {
        guard let id, !id.isEmpty else { return }
        router.pendingRiskId = nil
        if let risk = risks.first(where: { $0.id == id }) {
            deepLinkRisk = risk
        }
    }

    @MainActor
    private func loadIfNeeded() {
        if errorMessage != nil { return }
        if jobs.isEmpty || projects.isEmpty {
            load()
        }
    }

    @MainActor
    private func loadAsync() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            jobs = try await ManagerAPI.aiRequests(limit: 100)
            projects = (try? await ManagerAPI.projects()) ?? []
            let reports = (try? await ManagerAPI.reports(limit: 100)) ?? []
            var names: [String: String] = [:]
            for report in reports {
                if let projectId = report.projectId,
                   let name = projects.first(where: { $0.id == projectId })?.name,
                   !name.isEmpty {
                    names[report.id] = name
                }
            }
            reportProjectNames = names
            lastSync = Date()
        } catch {
            if ManagerV43Preview.showsCatalogWithoutAuth {
                projects = ManagerDemoCatalog.projects
                lastSync = Date()
                errorMessage = nil
            } else {
                errorMessage = localizedManagerError(error)
            }
        }
        openPendingRisk(router.pendingRiskId)
    }
}

struct AIJobRowView: View {
    let job: AIJobDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(job.type ?? "—")
                .font(.subheadline)
            HStack {
                Text(job.status ?? "—")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let e = job.entity, !e.isEmpty {
                    Text(String(format: NSLocalizedString("mgr_bullet_entity_fmt", comment: ""), e))
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
            }
            if let err = job.lastError, !err.isEmpty {
                Text(err)
                    .font(.caption2)
                    .foregroundStyle(ManagerSemanticColors.error)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 4)
    }
}
