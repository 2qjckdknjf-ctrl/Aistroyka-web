//
//  AITabView.swift
//  AiStroyka Manager
//
//  First real AI integration: lists AI analysis jobs from GET /api/v1/ai/requests.
//

import SwiftUI

struct AITabView: View {
    @State private var jobs: [AIJobDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && jobs.isEmpty && errorMessage == nil {
                    LoadingStateView(message: "Loading AI jobs…")
                } else if let err = errorMessage, jobs.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if jobs.isEmpty {
                    EmptyStateView(title: "No AI jobs", subtitle: "Analysis jobs will appear when reports are processed.")
                } else {
                    List(Array(jobs.enumerated()), id: \.offset) { _, job in
                        AIJobRowView(job: job)
                    }
                }
            }
            .navigationTitle("AI")
            .refreshable { await loadAsync() }
            .onAppear { load() }
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadAsync() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            jobs = try await ManagerAPI.aiRequests(limit: 100)
        } catch let e as APIError {
            errorMessage = e.message
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
                    .foregroundStyle(.secondary)
                if let e = job.entity, !e.isEmpty {
                    Text("· \(e)")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .lineLimit(1)
                }
            }
            if let err = job.lastError, !err.isEmpty {
                Text(err)
                    .font(.caption2)
                    .foregroundStyle(.red)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 4)
    }
}
