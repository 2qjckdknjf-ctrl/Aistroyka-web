//
//  AITabView.swift
//  AiStroyka Manager
//
//  First real AI integration: lists AI analysis jobs from GET /api/v1/ai/requests.
//

import SwiftUI
import Shared

struct AITabView: View {
    @State private var jobs: [AIJobDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && jobs.isEmpty && errorMessage == nil {
                    LoadingStateView(message: NSLocalizedString("mgr_loading_ai_jobs", comment: ""))
                } else if let err = errorMessage, jobs.isEmpty {
                    ErrorStateView(message: err, retryTitle: NSLocalizedString("mgr_retry", comment: ""), retry: { load() })
                } else if jobs.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_ai_jobs_title", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_ai_jobs_subtitle", comment: "")
                    )
                } else {
                    List {
                        Section {
                            Text(NSLocalizedString("mgr_ai_tab_copilot_hint", comment: ""))
                                .font(.caption)
                                .foregroundStyle(BrandTokens.textSecondary)
                        }
                        Section(NSLocalizedString("mgr_ai_jobs_section", comment: "")) {
                            ForEach(Array(jobs.enumerated()), id: \.offset) { _, job in
                                AIJobRowView(job: job)
                            }
                        }
                    }
                }
            }
            .navigationTitle(NSLocalizedString("mgr_tab_ai", comment: ""))
            .brandScrollChrome()
            .refreshable { await loadAsync() }
            .onAppear { loadIfNeeded() }
        }
    }

    @MainActor
    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    @MainActor
    private func loadIfNeeded() {
        guard shouldLoadInitially(items: jobs, errorMessage: errorMessage) else { return }
        load()
    }

    @MainActor
    private func loadAsync() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            jobs = try await ManagerAPI.aiRequests(limit: 100)
        } catch let apiError as APIError {
            errorMessage = apiError.message
        } catch {
            errorMessage = error.localizedDescription
        }
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
                    .foregroundStyle(BrandTokens.textSecondary)
                if let e = job.entity, !e.isEmpty {
                    Text(String(format: NSLocalizedString("mgr_bullet_entity_fmt", comment: ""), e))
                        .font(.caption)
                        .foregroundStyle(BrandTokens.textTertiary)
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
