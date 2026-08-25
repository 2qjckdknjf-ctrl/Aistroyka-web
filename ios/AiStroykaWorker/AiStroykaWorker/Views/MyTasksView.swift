//
//  MyTasksView.swift
//  AiStroykaWorker
//

import SwiftUI
import Shared

struct MyTasksView: View {
    @EnvironmentObject var router: WorkerTabRouter
    let project: ProjectDTO
    @ObservedObject private var store = AppStateStoreManager.shared
    @State private var tasks: [TaskDTO] = []
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var filter: WorkerTaskFilter = .today
    @State private var selectedDay = Date()
    @State private var openedTask: TaskDTO?

    var body: some View {
        NavigationStack {
            Group {
                if loading && tasks.isEmpty {
                    ScrollView { WorkerV43Skeleton(height: 220).padding(WorkerV43.screenX) }
                } else if let errorMessage, tasks.isEmpty {
                    WorkerV43EmptyState(title: WorkerV43Copy.userFacing(errorMessage), retry: load)
                } else {
                    content
                }
            }
            .background(WorkerV43.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { load() }
            .onAppear {
                load()
                openPendingTask()
            }
            .onChange(of: router.pendingTaskId) { _ in
                openPendingTask()
            }
            .background(
                NavigationLink(
                    destination: Group {
                        if let openedTask {
                            TaskDetailV43View(task: openedTask, projectId: project.id, dayId: store.state.shift.dayId)
                        }
                    },
                    isActive: Binding(
                        get: { openedTask != nil },
                        set: { if !$0 { openedTask = nil } }
                    )
                ) { EmptyView() }
                .hidden()
            )
        }
    }

    private var filtered: [TaskDTO] {
        switch filter {
        case .today:
            return tasks
        case .week:
            return tasks
        case .done:
            return tasks.filter { $0.status.lowercased().contains("done") || $0.status.lowercased().contains("complete") }
        }
    }

    private var content: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(NSLocalizedString("wrk_v43_my_tasks", comment: ""))
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(WorkerV43.textPrimary)
                weekStrip
                HStack(spacing: 8) {
                    ForEach(WorkerTaskFilter.allCases, id: \.self) { item in
                        WorkerV43Chip(
                            title: label(item),
                            selected: filter == item
                        ) { filter = item }
                    }
                }
                WorkerV43Card {
                    HStack {
                        Image(systemName: "building.2")
                            .foregroundStyle(WorkerV43.cyan)
                        Text(project.name ?? project.id)
                            .foregroundStyle(WorkerV43.textPrimary)
                        Spacer()
                    }
                    HStack(spacing: 12) {
                        Label("\(inProgress.count)", systemImage: "circle.fill")
                            .foregroundStyle(WorkerV43.dataBlue)
                        Label("\(waiting.count)", systemImage: "clock")
                            .foregroundStyle(WorkerV43.warning)
                        Label("\(overdue.count)", systemImage: "exclamationmark.circle")
                            .foregroundStyle(WorkerV43.danger)
                    }
                    .font(.caption)
                }
                section(NSLocalizedString("wrk_v43_in_progress", comment: ""), inProgress, border: WorkerV43.dataBlue)
                section(NSLocalizedString("wrk_v43_next", comment: ""), upcoming, border: WorkerV43.border)
                section(NSLocalizedString("wrk_v43_awaiting_review", comment: ""), waiting, border: WorkerV43.aiViolet)
                section(NSLocalizedString("wrk_v43_overdue", comment: ""), overdue, border: WorkerV43.danger)
            }
            .padding(WorkerV43.screenX)
        }
    }

    private var inProgress: [TaskDTO] {
        filtered.filter { $0.status.lowercased().contains("progress") }
    }

    private var upcoming: [TaskDTO] {
        filtered.filter { task in
            let status = task.status.lowercased()
            return (status == "open" || status.contains("todo") || status.contains("upcoming"))
                && !status.contains("progress")
                && !status.contains("review")
                && !status.contains("overdue")
        }
    }

    private var waiting: [TaskDTO] {
        filtered.filter { $0.status.lowercased().contains("review") || $0.status.lowercased().contains("pending") }
    }

    private var overdue: [TaskDTO] {
        filtered.filter { $0.status.lowercased().contains("overdue") || $0.status.lowercased().contains("late") }
    }

    private var weekStrip: some View {
        let days = (-1...5).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: Date()) }
        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(days, id: \.self) { day in
                    let on = Calendar.current.isDate(day, inSameDayAs: selectedDay)
                    Button { selectedDay = day } label: {
                        Text(shortDay(day))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(on ? WorkerV43.yellowInk : WorkerV43.textPrimary)
                            .padding(.horizontal, 10)
                            .frame(minHeight: 40)
                            .background(on ? WorkerV43.yellow : WorkerV43.card)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func section(_ title: String, _ items: [TaskDTO], border: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(WorkerV43.textPrimary)
            if items.isEmpty {
                Text(NSLocalizedString("wrk_v43_section_empty", comment: ""))
                    .font(.caption)
                    .foregroundStyle(WorkerV43.textSecondary)
            }
            ForEach(items, id: \.id) { task in
                NavigationLink {
                    TaskDetailV43View(task: task, projectId: project.id, dayId: store.state.shift.dayId)
                } label: {
                    WorkerV43Card(borderColor: border.opacity(0.55)) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(task.title)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(WorkerV43.textPrimary)
                            Text(task.dueDate ?? WorkerV43Copy.taskStatus(task.status))
                                .font(.system(size: 13))
                                .foregroundStyle(WorkerV43.textSecondary)
                            let progress = WorkerTaskProgressStore.load(taskId: task.id)
                            ProgressView(value: progress.progress).tint(WorkerV43.dataBlue)
                        }
                    }
                }
                .accessibilityIdentifier("pilot_worker_task_\(task.id)")
            }
        }
    }

    private func label(_ filter: WorkerTaskFilter) -> String {
        switch filter {
        case .today: return String(format: NSLocalizedString("wrk_v43_filter_today_fmt", comment: ""), tasks.count)
        case .week: return NSLocalizedString("wrk_v43_filter_week", comment: "")
        case .done: return NSLocalizedString("wrk_v43_filter_done", comment: "")
        }
    }

    private func shortDay(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EE d"
        return f.string(from: date)
    }

    private func openPendingTask() {
        guard let id = router.pendingTaskId else { return }
        router.pendingTaskId = nil
        if let match = tasks.first(where: { $0.id == id }) {
            openedTask = match
            return
        }
        if WorkerV43Preview.isEnabled {
            openedTask = WorkerV43PreviewCatalog.tasks(projectId: project.id).first(where: { $0.id == id })
        }
    }

    private func load() {
        errorMessage = nil
        if WorkerV43Preview.isEnabled {
            tasks = WorkerV43PreviewCatalog.tasks(projectId: project.id)
            loading = false
            return
        }
        loading = tasks.isEmpty
        Task {
            do {
                let list = try await WorkerAPI.tasksToday(projectId: project.id)
                await MainActor.run {
                    tasks = list
                    loading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = WorkerV43Copy.userFacing(error)
                    loading = false
                }
            }
        }
    }
}
