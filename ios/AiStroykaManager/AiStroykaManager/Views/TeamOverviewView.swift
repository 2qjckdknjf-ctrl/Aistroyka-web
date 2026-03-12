//
//  TeamOverviewView.swift
//  AiStroyka Manager
//

import SwiftUI
import Shared

struct TeamOverviewView: View {
    @State private var workers: [WorkerRowDTO] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && workers.isEmpty && errorMessage == nil {
                    LoadingStateView(message: "Loading team…")
                } else if let err = errorMessage, workers.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if workers.isEmpty {
                    EmptyStateView(title: "No workers yet", subtitle: "Workers appear when they join the tenant.")
                } else {
                    List(workers, id: \.userId) { w in
                        NavigationLink(destination: WorkerDetailView(worker: w)) {
                            WorkerRowView(worker: w)
                        }
                    }
                }
            }
            .navigationTitle("Team")
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
            workers = try await ManagerAPI.workers(limit: 200)
        } catch let e as APIError {
            errorMessage = e.message
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct WorkerRowView: View {
    let worker: WorkerRowDTO

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(worker.userId)
                .font(.subheadline)
                .lineLimit(1)
            if let day = worker.lastDayDate {
                Text("Last day: \(day)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if let a = worker.anomalies, (a.openShift == true || a.overtime == true || a.noActivity == true) {
                HStack(spacing: 6) {
                    if a.openShift == true { Label("Open shift", systemImage: "clock.badge.exclamation").font(.caption2).foregroundStyle(.orange) }
                    if a.overtime == true { Label("Overtime", systemImage: "exclamationmark.triangle").font(.caption2).foregroundStyle(.orange) }
                    if a.noActivity == true { Label("No activity", systemImage: "person.slash").font(.caption2).foregroundStyle(.secondary) }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct WorkerDetailView: View {
    let worker: WorkerRowDTO

    var body: some View {
        List {
            Section("Worker") {
                LabeledContent("User ID", value: worker.userId)
            }
            Section("Last activity") {
                if let d = worker.lastDayDate { LabeledContent("Day", value: d) }
                if let s = worker.lastStartedAt { LabeledContent("Started", value: formatDate(s)) }
                if let e = worker.lastEndedAt { LabeledContent("Ended", value: formatDate(e)) }
                if let r = worker.lastReportSubmittedAt { LabeledContent("Last report", value: formatDate(r)) }
            }
            if let a = worker.anomalies {
                Section("Flags") {
                    if a.openShift == true { Label("Open shift", systemImage: "clock.badge.exclamation") }
                    if a.overtime == true { Label("Overtime", systemImage: "exclamationmark.triangle") }
                    if a.noActivity == true { Label("No recent activity", systemImage: "person.slash") }
                }
            }
        }
        .navigationTitle("Worker")
    }

    private func formatDate(_ s: String) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) ?? ISO8601DateFormatter().date(from: String(s.prefix(19)) + "Z") {
            return d.formatted(date: .abbreviated, time: .shortened)
        }
        return s
    }
}
