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
                    LoadingStateView(message: NSLocalizedString("mgr_loading_team", comment: ""))
                } else if let err = errorMessage, workers.isEmpty {
                    ErrorStateView(message: err, retry: { load() })
                } else if workers.isEmpty {
                    EmptyStateView(
                        title: NSLocalizedString("mgr_no_workers_title", comment: ""),
                        subtitle: NSLocalizedString("mgr_no_workers_subtitle", comment: "")
                    )
                } else {
                    List(workers, id: \.userId) { w in
                        NavigationLink(destination: WorkerDetailView(worker: w)) {
                            WorkerRowView(worker: w)
                        }
                    }
                }
            }
            .navigationTitle(NSLocalizedString("mgr_tab_team", comment: ""))
            .refreshable { await loadAsync() }
            .onAppear { loadIfNeeded() }
        }
    }

    private func load() {
        errorMessage = nil
        isLoading = true
        Task { await loadAsync() }
    }

    private func loadIfNeeded() {
        guard shouldLoadInitially(items: workers, errorMessage: errorMessage) else { return }
        load()
    }

    private func loadAsync() async {
        await runManagerLoad(isLoading: &isLoading, errorMessage: &errorMessage) {
            workers = try await ManagerAPI.workers(limit: 200)
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
                Text(String(format: NSLocalizedString("mgr_last_day_fmt", comment: ""), day))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if let a = worker.anomalies, (a.openShift == true || a.overtime == true || a.noActivity == true) {
                HStack(spacing: 6) {
                    if a.openShift == true { Label(NSLocalizedString("mgr_open_shift", comment: ""), systemImage: "clock.badge.exclamation").font(.caption2).foregroundStyle(.orange) }
                    if a.overtime == true { Label(NSLocalizedString("mgr_overtime", comment: ""), systemImage: "exclamationmark.triangle").font(.caption2).foregroundStyle(.orange) }
                    if a.noActivity == true { Label(NSLocalizedString("mgr_no_activity", comment: ""), systemImage: "person.slash").font(.caption2).foregroundStyle(.secondary) }
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
            Section(NSLocalizedString("mgr_worker_section", comment: "")) {
                LabeledContent(NSLocalizedString("mgr_user_id", comment: ""), value: worker.userId)
            }
            Section(NSLocalizedString("mgr_last_activity_section", comment: "")) {
                if let d = worker.lastDayDate { LabeledContent(NSLocalizedString("mgr_day", comment: ""), value: d) }
                if let s = worker.lastStartedAt { LabeledContent(NSLocalizedString("mgr_started", comment: ""), value: formatDate(s)) }
                if let e = worker.lastEndedAt { LabeledContent(NSLocalizedString("mgr_ended", comment: ""), value: formatDate(e)) }
                if let r = worker.lastReportSubmittedAt { LabeledContent(NSLocalizedString("mgr_last_report", comment: ""), value: formatDate(r)) }
            }
            if let a = worker.anomalies {
                Section(NSLocalizedString("mgr_flags_section", comment: "")) {
                    if a.openShift == true { Label(NSLocalizedString("mgr_open_shift", comment: ""), systemImage: "clock.badge.exclamation") }
                    if a.overtime == true { Label(NSLocalizedString("mgr_overtime", comment: ""), systemImage: "exclamationmark.triangle") }
                    if a.noActivity == true { Label(NSLocalizedString("mgr_no_recent_activity", comment: ""), systemImage: "person.slash") }
                }
            }
        }
        .navigationTitle(NSLocalizedString("mgr_worker", comment: ""))
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
