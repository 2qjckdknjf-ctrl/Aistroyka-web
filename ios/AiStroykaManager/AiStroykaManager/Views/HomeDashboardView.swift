//
//  HomeDashboardView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct HomeDashboardView: View {
    @State private var overview: OpsOverviewDTO?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && overview == nil {
                    LoadingStateView(message: "Loading dashboard…")
                } else if let err = errorMessage, overview == nil {
                    ErrorStateView(message: err, retry: { load() })
                } else {
                    content
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Home")
            .refreshable { await loadAsync() }
            .onAppear { load() }
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
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

    private func kpiSection(_ kpis: OpsOverviewDTO.OpsOverviewKpis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Overview")
                .font(.headline)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                KPICard(title: "Active projects", value: "\(kpis.activeProjects ?? 0)")
                KPICard(title: "Workers today", value: "\(kpis.activeWorkersToday ?? 0)")
                KPICard(title: "Reports today", value: "\(kpis.reportsToday ?? 0)")
                KPICard(title: "Overdue tasks", value: "\(kpis.tasksOverdue ?? 0)")
                KPICard(title: "Open today", value: "\(kpis.tasksOpenToday ?? 0)")
                KPICard(title: "Stuck uploads", value: "\(kpis.stuckUploads ?? 0)")
            }
        }
    }

    private func queuesSection(_ queues: OpsOverviewDTO.OpsOverviewQueues) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Needs attention")
                .font(.headline)
            if let overdue = queues.tasksOverdue, !overdue.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Overdue tasks")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    ForEach(Array(overdue.prefix(5)), id: \.id) { t in
                        NavigationLink(destination: TaskDetailManagerView(taskId: t.id ?? "")) {
                            Text(t.title ?? t.id ?? "")
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let openToday = queues.tasksOpenToday, !openToday.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Due today")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    ForEach(Array(openToday.prefix(5)), id: \.id) { t in
                        NavigationLink(destination: TaskDetailManagerView(taskId: t.id ?? "")) {
                            Text(t.title ?? t.id ?? "")
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let pending = queues.reportsPendingReview, !pending.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Reports pending review")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    ForEach(Array(pending.prefix(5)), id: \.id) { r in
                        NavigationLink(destination: ReportDetailReviewView(reportId: r.id ?? "")) {
                            Text(r.id ?? "")
                                .font(.caption)
                                .foregroundStyle(.primary)
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private func load() {
        Task { await loadAsync() }
    }

    private func loadAsync() async {
        isLoading = true
        errorMessage = nil
        do {
            overview = try await ManagerAPI.opsOverview()
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
